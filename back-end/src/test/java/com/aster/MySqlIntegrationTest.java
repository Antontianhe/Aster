package com.aster;

import static com.aster.util.Json.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

import com.aster.persistence.*;
import com.aster.service.*;
import jakarta.servlet.http.Cookie;
import java.util.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

/** Uses the installed MySQL over TLS. Every test rolls back all database writes. */
@SpringBootTest(properties = "aster.scheduling.enabled=false")
@AutoConfigureMockMvc
@Transactional
@EnabledIfEnvironmentVariable(named = "ASTER_INTEGRATION_TESTS", matches = "true")
class MySqlIntegrationTest {
  @Autowired MockMvc mvc;
  @Autowired AuthService auth;
  @Autowired CommunityService chat;
  @Autowired ExamService exams;
  @Autowired JdbcTemplate jdbc;

  private MockHttpServletRequestBuilder request(
      String method, String path, Object body, Cookie cookie) {
    var b =
        org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request(
                org.springframework.http.HttpMethod.valueOf(method), "/api" + path)
            .header("Host", "127.0.0.1:5173")
            .header("Origin", "http://127.0.0.1:5173")
            .header("X-Aster-Client", "workspace")
            .contentType("application/json");
    if (body != null) b.content(write(body));
    if (cookie != null) b.cookie(cookie);
    return b;
  }

  private Map<String, Object> result(MvcResult r) throws Exception {
    return obj(parse(r.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8)));
  }

  private Map<String, Object> account() {
    String username = "javatest-" + UUID.randomUUID().toString().substring(0, 12);
    var challenge =
        auth.register(
            map(
                "username",
                username,
                "password",
                "migration-test-password",
                "name",
                "Transactional test",
                "contact",
                username + "@example.invalid",
                "acceptTerms",
                true));
    var v = obj(challenge.get("verification"));
    return auth.verify(map("token", v.get("token"), "code", v.get("demoCode")));
  }

  @Test
  void mysqlConnectionUsesTlsAndMyBatisPlusReadsAndWritesExistingSchema() {
    assertNotNull(jdbc.queryForMap("SHOW STATUS LIKE 'Ssl_cipher'").get("Value"));
    assertFalse(
        String.valueOf(jdbc.queryForMap("SHOW STATUS LIKE 'Ssl_cipher'").get("Value")).isBlank());
    var user = account();
    assertEquals(
        user.get("name"),
        jdbc.queryForObject(
            "SELECT display_name FROM users WHERE id=?", String.class, user.get("id")));
  }

  @Test
  void signupVerificationLoginSessionsPrivacyAndWorkspaceIsolation() throws Exception {
    String username = "javatest-" + UUID.randomUUID().toString().substring(0, 12);
    var payload =
        map(
            "username",
            username,
            "password",
            "migration-test-password",
            "name",
            "Transactional test",
            "contact",
            username + "@example.invalid",
            "acceptTerms",
            true);
    assertEquals(
        401,
        mvc.perform(request("GET", "/workspace", null, null))
            .andReturn()
            .getResponse()
            .getStatus());
    var created = mvc.perform(request("POST", "/auth/register", payload, null)).andReturn();
    assertEquals(200, created.getResponse().getStatus());
    assertNull(created.getResponse().getHeader("Set-Cookie"));
    var v = obj(result(created).get("verification"));
    assertEquals("local-preview", v.get("mode"));
    assertEquals(
        400,
        mvc.perform(
                request(
                    "POST",
                    "/auth/verify-preview",
                    map("token", v.get("token"), "code", "000000"),
                    null))
            .andReturn()
            .getResponse()
            .getStatus());
    var verified =
        mvc.perform(
                request(
                    "POST",
                    "/auth/verify-preview",
                    map("token", v.get("token"), "code", v.get("demoCode")),
                    null))
            .andReturn();
    assertEquals(200, verified.getResponse().getStatus());
    String setCookie = verified.getResponse().getHeader("Set-Cookie");
    assertTrue(setCookie.contains("HttpOnly"));
    assertTrue(setCookie.contains("SameSite=Strict"));
    Cookie cookie = new Cookie("aster_session", setCookie.split("[=;]")[1]);
    String id = str(obj(result(verified).get("user")).get("id"));
    assertEquals(
        400,
        mvc.perform(
                request(
                    "POST",
                    "/auth/verify-preview",
                    map("token", v.get("token"), "code", v.get("demoCode")),
                    null))
            .andReturn()
            .getResponse()
            .getStatus());
    assertEquals(
        409,
        mvc.perform(request("POST", "/auth/register", payload, null))
            .andReturn()
            .getResponse()
            .getStatus());
    assertEquals(
        401,
        mvc.perform(
                request(
                    "POST",
                    "/auth/login",
                    map("username", username, "password", "incorrect-password"),
                    null))
            .andReturn()
            .getResponse()
            .getStatus());
    var content = map("aster-integration", "{\"saved\":true}");
    assertEquals(
        200,
        mvc.perform(request("PUT", "/workspace", map("data", content), cookie))
            .andReturn()
            .getResponse()
            .getStatus());
    assertEquals(
        content,
        result(mvc.perform(request("GET", "/workspace", null, cookie)).andReturn()).get("data"));
    var other = account();
    var response = new org.springframework.mock.web.MockHttpServletResponse();
    auth.session(other, response);
    Cookie otherCookie =
        new Cookie("aster_session", response.getHeader("Set-Cookie").split("[=;]")[1]);
    assertEquals(
        map(),
        result(mvc.perform(request("GET", "/workspace", null, otherCookie)).andReturn())
            .get("data"));
    assertEquals(
        400,
        mvc.perform(request("PUT", "/workspace", map("data", map("password", "oops")), cookie))
            .andReturn()
            .getResponse()
            .getStatus());
    assertEquals(
        200,
        mvc.perform(request("PUT", "/portal", map("data", map("grades", List.of())), cookie))
            .andReturn()
            .getResponse()
            .getStatus());
    assertEquals(
        map("grades", List.of()),
        result(mvc.perform(request("GET", "/portal", null, cookie)).andReturn()).get("data"));
    assertEquals(
        false,
        result(mvc.perform(request("GET", "/account/privacy", null, cookie)).andReturn())
            .get("analytics"));
    assertEquals(
        403,
        mvc.perform(request("GET", "/owner/insights", null, cookie))
            .andReturn()
            .getResponse()
            .getStatus());
    assertEquals(
        400,
        mvc.perform(
                request(
                    "PUT", "/account/privacy", map("analytics", "yes", "sharing", true), cookie))
            .andReturn()
            .getResponse()
            .getStatus());
    assertEquals(
        200,
        mvc.perform(
                request("PUT", "/account/privacy", map("analytics", true, "sharing", true), cookie))
            .andReturn()
            .getResponse()
            .getStatus());
    jdbc.update("INSERT INTO account_roles(user_id,role) VALUES (?,'owner')", id);
    var insights = result(mvc.perform(request("GET", "/owner/insights", null, cookie)).andReturn());
    assertTrue(list(insights.get("shared")).stream().anyMatch(s -> id.equals(obj(s).get("id"))));
    mvc.perform(
        request("PUT", "/account/privacy", map("analytics", false, "sharing", false), cookie));
    assertFalse(
        list(
                result(mvc.perform(request("GET", "/owner/insights", null, cookie)).andReturn())
                    .get("shared"))
            .stream()
            .anyMatch(s -> id.equals(obj(s).get("id"))));
    assertEquals(
        400,
        mvc.perform(request("PUT", "/school-news", map("url", "https://example.com/feed"), cookie))
            .andReturn()
            .getResponse()
            .getStatus());
    assertEquals(
        200,
        mvc.perform(
                request(
                    "POST",
                    "/auth/login",
                    map("username", username, "password", "migration-test-password"),
                    null))
            .andReturn()
            .getResponse()
            .getStatus());
    assertEquals(
        username,
        obj(result(mvc.perform(request("GET", "/auth/session", null, cookie)).andReturn())
                .get("user"))
            .get("username"));
    mvc.perform(request("POST", "/auth/logout", map(), cookie));
    assertEquals(
        401,
        mvc.perform(request("GET", "/workspace", null, cookie))
            .andReturn()
            .getResponse()
            .getStatus());
  }

  @Test
  void failedCodesLockAndExpiredChallengesCannotBeUsed() {
    String username = "javatest-" + UUID.randomUUID().toString().substring(0, 12);
    var challenge =
        auth.register(
            map(
                "username",
                username,
                "password",
                "migration-test-password",
                "contact",
                "test@example.invalid",
                "acceptTerms",
                true));
    var v = obj(challenge.get("verification"));
    for (int i = 0; i < 5; i++)
      assertThrows(
          com.aster.api.ApiException.class,
          () -> auth.verify(map("token", v.get("token"), "code", "000000")));
    assertThrows(
        com.aster.api.ApiException.class,
        () -> auth.verify(map("token", v.get("token"), "code", v.get("demoCode"))));
    String id =
        jdbc.queryForObject(
            "SELECT user_id FROM credentials WHERE username=?", String.class, username);
    var renewed = obj(auth.challenge(map("id", id)).get("verification"));
    jdbc.update(
        "UPDATE verification_challenges SET expires_at=DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 SECOND)"
            + " WHERE user_id=?",
        id);
    assertThrows(
        com.aster.api.ApiException.class,
        () -> auth.verify(map("token", renewed.get("token"), "code", renewed.get("demoCode"))));
  }

  @Test
  void sharedChatDeduplicatesAndEnforcesOwnership() {
    var a = account();
    var b = account();
    String aid = str(a.get("id")), bid = str(b.get("id"));
    var payload =
        map(
            "room",
            "general",
            "content",
            "Uncommitted question",
            "clientId",
            UUID.randomUUID().toString());
    chat.post(aid, payload);
    chat.post(aid, payload);
    var messages = jdbc.queryForList("SELECT id FROM community_messages WHERE user_id=?", aid);
    assertEquals(1, messages.size());
    String id = String.valueOf(messages.getFirst().get("id"));
    assertThrows(
        com.aster.api.ApiException.class,
        () -> chat.change(bid, id, map("content", "Not allowed")));
    chat.post(
        bid,
        map(
            "room",
            "general",
            "content",
            "Uncommitted reply",
            "replyId",
            id,
            "clientId",
            UUID.randomUUID().toString()));
    assertTrue(
        list(chat.list("general", null).get("messages")).stream()
            .map(com.aster.util.Json::obj)
            .anyMatch(m -> bid.equals(m.get("userId")) && m.get("replyUsername") != null));
    chat.change(aid, id, map("content", "Updated question"));
    chat.change(aid, id, map("action", "remove"));
    assertTrue(
        list(chat.list("general", null).get("messages")).stream()
            .map(com.aster.util.Json::obj)
            .anyMatch(m -> id.equals(String.valueOf(m.get("id"))) && "".equals(m.get("content"))));
    chat.change(aid, id, map("action", "restore"));
    chat.report(bid, id, "Spam");
    assertEquals(
        "Spam",
        jdbc.queryForObject(
            "SELECT reason FROM community_reports WHERE message_id=? AND user_id=?",
            String.class,
            id,
            bid));
  }

  @Test
  void mockExamsPrepareAutomaticallyIsolateAccountsAndFreezeFirstResult() {
    var a = account();
    var b = account();
    String aid = str(a.get("id")), bid = str(b.get("id"));
    var result =
        exams.add(
            aid,
            map(
                "title",
                "Uncommitted automatic mock",
                "date",
                "2020-01-02",
                "minutes",
                10,
                "course",
                "ig-0580",
                "topics",
                List.of("algebra"),
                "cards",
                List.of()));
    var exam = obj(list(result.get("exams")).getFirst());
    String id = str(exam.get("id"));
    assertEquals(2, list(obj(exam.get("blueprint")).get("questions")).size());
    assertTrue(list(exams.listExams(bid).get("exams")).isEmpty());
    assertThrows(
        com.aster.api.ApiException.class, () -> exams.action(bid, id, map("action", "generate")));
    var first =
        exams.action(
            aid,
            id,
            map(
                "action",
                "submit",
                "answers",
                map(
                    "algebra-check",
                    1,
                    "algebra-explain",
                    "Use the same operation on each side.")));
    assertEquals(1, obj(first.get("result")).get("correct"));
    assertEquals(true, first.get("firstSubmission"));
    var retry = exams.action(aid, id, map("action", "submit", "answers", map()));
    assertEquals(false, retry.get("firstSubmission"));
    assertEquals(1, number(obj(retry.get("result")).get("correct")));
    exams.action(aid, id, map("action", "remove"));
    assertTrue(list(exams.listExams(aid).get("exams")).isEmpty());
  }

  @Test
  void csrfHostAndRequestSizeGuardsApplyToTheJavaApi() throws Exception {
    assertEquals(
        403,
        mvc.perform(
                post("/api/auth/login")
                    .header("Host", "127.0.0.1:5173")
                    .header("Origin", "https://evil.example")
                    .header("X-Aster-Client", "workspace")
                    .contentType("application/json")
                    .content("{}"))
            .andReturn()
            .getResponse()
            .getStatus());
    assertEquals(
        403,
        mvc.perform(get("/api/health").header("Host", "evil.example"))
            .andReturn()
            .getResponse()
            .getStatus());
    assertEquals(
        413,
        mvc.perform(request("POST", "/auth/login", map("message", "x".repeat(2_000_001)), null))
            .andReturn()
            .getResponse()
            .getStatus());
    assertEquals(
        200,
        mvc.perform(request("GET", "/health", null, null)).andReturn().getResponse().getStatus());
  }
}
