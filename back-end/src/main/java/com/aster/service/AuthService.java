package com.aster.service;

import static com.aster.util.Json.*;

import com.aster.api.ApiException;
import com.aster.persistence.*;
import com.aster.security.Passwords;
import jakarta.servlet.http.*;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class AuthService {
  private final AuthMapper db;
  private final TransactionTemplate tx;

  public AuthService(AuthMapper db, TransactionTemplate tx) {
    this.db = db;
    this.tx = tx;
  }

  private String cookie(HttpServletRequest request) {
    if (request.getCookies() != null)
      for (Cookie c : request.getCookies())
        if (c.getName().equals("aster_session") && c.getValue().matches("[a-f0-9]{64}"))
          return c.getValue();
    return "";
  }

  public Map<String, Object> current(HttpServletRequest request) {
    String token = cookie(request);
    return token.isEmpty() ? null : db.session(Passwords.sha(token));
  }

  public String require(HttpServletRequest request) {
    var user = current(request);
    if (user == null) throw new ApiException(401, "Sign in to your Aster account first.");
    return str(user.get("id"));
  }

  public void session(Map<String, Object> user, HttpServletResponse response) {
    String token = Passwords.token(32);
    db.newSession(Passwords.sha(token), str(user.get("id")));
    response.addHeader(
        "Set-Cookie",
        "aster_session=" + token + "; HttpOnly; SameSite=Strict; Path=/api; Max-Age=86400");
  }

  public void logout(HttpServletRequest request, HttpServletResponse response) {
    db.logout(Passwords.sha(cookie(request)));
    response.addHeader(
        "Set-Cookie", "aster_session=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0");
  }

  public static void validateCredentials(Map<String, Object> b) {
    String username = text(b.get("username"), 100).toLowerCase(Locale.ROOT),
        password = str(b.get("password"));
    if (!username.matches("[a-z0-9_.-]{3,30}"))
      throw ApiException.bad(
          "Use 3–30 letters, numbers, dots, dashes, or underscores for your username.");
    if (password.length() < 10 || password.length() > 128)
      throw ApiException.bad("Use a password with 10–128 characters.");
  }

  public static Map<String, Object> consent(Map<String, Object> b) {
    if (!Boolean.TRUE.equals(b.get("acceptTerms")))
      throw ApiException.bad("Please accept the preview terms to create an account.");
    String channel = "phone".equals(b.get("channel")) ? "phone" : "email",
        contact = str(b.get("contact")).trim();
    if (channel.equals("email")
        ? !contact.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+") || contact.length() > 254
        : !contact.matches("\\+[1-9]\\d{7,14}"))
      throw ApiException.bad(
          channel.equals("email")
              ? "Enter a valid email address."
              : "Use an international phone number, for example +491234567890.");
    return map("channel", channel, "contact", contact);
  }

  public Map<String, Object> register(Map<String, Object> b) {
    validateCredentials(b);
    var consent = consent(b);
    String birthday = validateBirthday(b.get("dateOfBirth"));
    String id = UUID.randomUUID().toString(),
        username = str(b.get("username")).trim().toLowerCase(Locale.ROOT);
    String name = text(b.get("name"), 30);
    if (name.isEmpty()) name = username;
    var user = map("id", id, "name", name, "username", username);
    String hash = Passwords.hash(str(b.get("password")));
    return tx.execute(
        status -> {
          db.insert(new UserEntity(id, str(user.get("name"))));
          db.credentials(id, username, hash);
          db.preferences(id, str(consent.get("contact")), str(consent.get("channel")));
          db.initialWorkspace(id, write(map("dinostudy-preferences-v3", write(map(
              "name", user.get("name"), "birthday", birthday.substring(5),
              "profile", map("fullName", text(b.get("fullName"), 100), "dateOfBirth", birthday,
                  "email", "email".equals(consent.get("channel")) ? consent.get("contact") : "",
                  "phone", "phone".equals(consent.get("channel")) ? consent.get("contact") : ""))))));
          return challenge(user);
        });
  }

  public static String validateBirthday(Object value) {
    String birthday = str(value);
    try {
      LocalDate date = LocalDate.parse(birthday);
      if (date.isBefore(LocalDate.of(1900, 1, 1)) || date.isAfter(LocalDate.now(ZoneId.of("Europe/Berlin"))))
        throw new IllegalArgumentException();
      return date.toString();
    } catch (Exception e) {
      throw ApiException.bad("Enter a valid birthday that is not in the future.");
    }
  }

  public Map<String, Object> login(Map<String, Object> b, HttpServletResponse response) {
    validateCredentials(b);
    var user = db.login(str(b.get("username")).trim().toLowerCase(Locale.ROOT));
    if (!Passwords.verify(
        str(b.get("password")), user == null ? null : str(user.get("passwordHash"))))
      throw new ApiException(401, "Username or password is incorrect.");
    user.remove("passwordHash");
    var preferences = db.preferencesFor(str(user.get("id")));
    if (preferences != null && preferences.get("verified") == null) return challenge(user);
    session(user, response);
    return map("user", user);
  }

  public Map<String, Object> challenge(Map<String, Object> user) {
    String token = Passwords.token(32),
        code = String.valueOf(new SecureRandom().nextInt(900000) + 100000),
        id = str(user.get("id"));
    tx.executeWithoutResult(
        status -> {
          db.clearChallenges(id);
          db.challenge(Passwords.sha(token), id, Passwords.sha(token + code));
        });
    var p = db.preferencesFor(id);
    return map(
        "verification",
        map(
            "token",
            token,
            "demoCode",
            code,
            "mode",
            "local-preview",
            "channel",
            p.get("channel"),
            "contact",
            p.get("contact"),
            "expiresAt",
            Instant.now().plusSeconds(600).toString()));
  }

  public Map<String, Object> verify(Map<String, Object> b) {
    String token = str(b.get("token")), code = str(b.get("code"));
    if (!token.matches("[a-f0-9]{64}") || !code.matches("\\d{6}"))
      throw ApiException.bad("Enter the six-digit preview code.");
    Map<String, Object> result =
        tx.execute(
            status -> {
              var c = db.challengeForUpdate(Passwords.sha(token));
              if (c == null || !bool(c.get("active")) || number(c.get("attempts")) >= 5)
                throw ApiException.bad(
                    "This code expired or has too many attempts. Sign in again to get a new preview"
                        + " code.");
              if (!Passwords.sha(token + code).equals(c.get("code_hash"))) {
                db.failedAttempt(str(c.get("token_hash")));
                return null;
              }
              String id = str(c.get("user_id"));
              db.verified(id);
              db.clearChallenges(id);
              return db.user(id);
            });
    // Throw after committing the failed-attempt counter.
    if (result == null)
      throw ApiException.bad("That code does not match. Try the code shown in the preview panel.");
    return result;
  }

  public Map<String, Object> privacy(String id, Map<String, Object> b) {
    if (b != null) {
      if (!(b.get("analytics") instanceof Boolean) || !(b.get("sharing") instanceof Boolean))
        throw ApiException.bad("Choose valid privacy preferences.");
      db.privacy(id, bool(b.get("analytics")), bool(b.get("sharing")));
    }
    var p = db.preferencesFor(id);
    return map(
        "analytics",
        p != null && bool(p.get("analytics")),
        "sharing",
        p != null && bool(p.get("sharing")),
        "updatedAt",
        p == null ? null : p.get("updatedAt"));
  }

  public Map<String, Object> insights(String id) {
    if (db.owner(id) == 0)
      throw new ApiException(
          403, "Only the configured Aster owner can view these opt-in insights.");
    long reviews = 0, minutes = 0;
    int participants = 0;
    var shared = new ArrayList<>();
    for (var row : db.insights()) {
      var content = obj(parse(row.get("content")));
      Map<String, Object> progress = new HashMap<>();
      try {
        progress = obj(parse(content.get("dinostudy-progress-v2")));
      } catch (Exception ignored) {
      }
      long r = count(progress.get("sessions")), m = count(progress.get("focusMinutes"));
      if (bool(row.get("analytics"))) {
        participants++;
        reviews += r;
        minutes += m;
      }
      if (bool(row.get("sharing")))
        shared.add(map("id", row.get("id"), "name", row.get("name"), "reviews", r, "minutes", m));
    }
    return map(
        "participants",
        participants,
        "reviews",
        participants >= 5 ? reviews : null,
        "minutes",
        participants >= 5 ? minutes : null,
        "shared",
        shared);
  }

  private long count(Object n) {
    return n instanceof Number num && Double.isFinite(num.doubleValue())
        ? Math.max(0, Math.min(1_000_000_000, number(n)))
        : 0;
  }

  @Scheduled(fixedDelay = 3600000)
  public void expire() {
    try {
      db.expireSessions();
    } catch (Exception ignored) {
    }
  }
}
