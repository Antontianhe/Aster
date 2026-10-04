package com.aster;

import static com.aster.util.Json.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import com.aster.api.ApiException;
import com.aster.api.LoginLockedException;
import com.aster.service.AuthService;
import java.sql.Timestamp;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "aster.scheduling.enabled=false")
@AutoConfigureMockMvc
@Transactional
@EnabledIfEnvironmentVariable(named = "ASTER_INTEGRATION_TESTS", matches = "true")
class LoginLockoutIntegrationTest {
  @Autowired AuthService auth;
  @Autowired JdbcTemplate jdbc;
  @Autowired MockMvc mvc;
  private static final String PASSWORD = "lockout-test-password";

  private String username() {
    return "locktest-" + UUID.randomUUID().toString().substring(0, 12);
  }

  private String account() {
    String username = username();
    var result = auth.register(map("username", username, "password", PASSWORD,
        "name", "Lockout test", "contact", username + "@example.invalid",
        "dateOfBirth", "2010-06-15", "acceptTerms", true));
    var challenge = obj(result.get("verification"));
    auth.verify(map("token", challenge.get("token"), "code", challenge.get("demoCode")));
    return username;
  }

  private void login(String username, String password) {
    auth.login(map("username", username, "password", password), new MockHttpServletResponse());
  }

  private void fail(String username) {
    assertEquals(401, assertThrows(ApiException.class, () -> login(username, "wrong")).status);
  }

  @Test
  void fifthMistakeLocksNormalizedUsernameAndReturnsCountdownWithoutExtendingIt() throws Exception {
    String username = account();
    for (int i = 0; i < 5; i++) {
      var response = mvc.perform(post("/api/auth/login")
          .header("Host", "127.0.0.1:5173").header("Origin", "http://127.0.0.1:5173")
          .header("X-Aster-Client", "workspace").contentType("application/json")
          .content(write(map("username", " " + username.toUpperCase(Locale.ROOT) + " ",
              "password", "wrong")))).andReturn().getResponse();
      assertEquals(i < 4 ? 401 : 429, response.getStatus());
      if (i == 4) {
        var body = obj(parse(response.getContentAsString()));
        assertEquals("LOGIN_LOCKED", body.get("code"));
        assertEquals(300, number(body.get("retryAfterSeconds")));
        assertEquals("300", response.getHeader("Retry-After"));
      }
    }
    Timestamp deadline = jdbc.queryForObject(
        "SELECT locked_until FROM auth_login_attempts WHERE username=?", Timestamp.class, username);
    for (int i = 0; i < 4; i++) {
      var blocked = assertThrows(LoginLockedException.class, () -> login(username, PASSWORD));
      assertTrue(blocked.retryAfterSeconds > 0 && blocked.retryAfterSeconds <= 300);
    }
    assertEquals(deadline, jdbc.queryForObject(
        "SELECT locked_until FROM auth_login_attempts WHERE username=?", Timestamp.class, username));
    login(account(), PASSWORD);
  }

  @Test
  void correctPasswordResetsConsecutiveFailuresAndExpiredLockStartsFresh() {
    String username = account();
    for (int i = 0; i < 4; i++) fail(username);
    login(username, PASSWORD);
    for (int i = 0; i < 4; i++) fail(username);
    assertThrows(LoginLockedException.class, () -> login(username, "wrong"));
    jdbc.update("UPDATE auth_login_attempts SET locked_until=DATE_SUB(UTC_TIMESTAMP(6),"
        + "INTERVAL 1 SECOND) WHERE username=?", username);
    fail(username);
    assertEquals(1, jdbc.queryForObject(
        "SELECT failed_attempts FROM auth_login_attempts WHERE username=?", Integer.class, username));
    login(username, PASSWORD);
    assertEquals(0, jdbc.queryForObject(
        "SELECT failed_attempts FROM auth_login_attempts WHERE username=?", Integer.class, username));
  }

  @Test
  void unknownUsernameReceivesTheSameLockout() {
    String username = username();
    for (int i = 0; i < 4; i++) fail(username);
    assertThrows(LoginLockedException.class, () -> login(username, "wrong"));
    assertThrows(LoginLockedException.class,
        () -> auth.checkLoginLock(map("username", username, "password", PASSWORD)));
  }

  @Test
  @Transactional(propagation = Propagation.NOT_SUPPORTED)
  void concurrentFailuresCommitExactlyFiveAttempts() throws Exception {
    String username = username();
    try (var pool = Executors.newFixedThreadPool(5)) {
      var gate = new CountDownLatch(1);
      List<Future<Integer>> results = new ArrayList<>();
      for (int i = 0; i < 5; i++) results.add(pool.submit(() -> {
        gate.await();
        try { login(username, "wrong"); return 200; }
        catch (ApiException ex) { return ex.status; }
      }));
      gate.countDown();
      List<Integer> statuses = new ArrayList<>();
      for (var result : results) statuses.add(result.get(20, TimeUnit.SECONDS));
      assertEquals(4, Collections.frequency(statuses, 401));
      assertEquals(1, Collections.frequency(statuses, 429));
      assertEquals(5, jdbc.queryForObject(
          "SELECT failed_attempts FROM auth_login_attempts WHERE username=?", Integer.class, username));
      assertThrows(LoginLockedException.class, () -> login(username, "wrong"));
    } finally {
      // This one uniquely named synthetic row is committed to exercise concurrent transactions.
      jdbc.update("DELETE FROM auth_login_attempts WHERE username=?", username);
    }
  }
}
