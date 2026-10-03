package com.aster.api;

import static com.aster.util.Json.*;

import com.aster.persistence.AuthMapper;
import com.aster.security.RateLimiter;
import com.aster.service.AuthService;
import jakarta.servlet.http.*;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AccountController {
  private final AuthService auth;
  private final AuthMapper db;
  private final RateLimiter rate;

  public AccountController(AuthService auth, AuthMapper db, RateLimiter rate) {
    this.auth = auth;
    this.db = db;
    this.rate = rate;
  }

  @GetMapping("/health")
  public Map<String, Object> health() {
    db.ping();
    return map("database", true, "backend", "spring-boot", "persistence", "mybatis-plus");
  }

  @GetMapping("/auth/session")
  public Map<String, Object> session(HttpServletRequest r) {
    return map("user", auth.current(r));
  }

  @PostMapping("/auth/logout")
  public Map<String, Object> logout(HttpServletRequest r, HttpServletResponse s) {
    auth.logout(r, s);
    return map("ok", true);
  }

  @PostMapping("/auth/register")
  public Map<String, Object> register(@RequestBody Map<String, Object> b, HttpServletRequest r) {
    limit(r, b);
    return auth.register(b);
  }

  @PostMapping("/auth/login")
  public Map<String, Object> login(
      @RequestBody Map<String, Object> b, HttpServletRequest r, HttpServletResponse s) {
    limit(r, b);
    return auth.login(b, s);
  }

  private void limit(HttpServletRequest r, Map<String, Object> b) {
    rate.check("auth:" + r.getRemoteAddr(), 15);
    rate.check("login:" + text(b.get("username"), 100).toLowerCase(Locale.ROOT), 7);
  }

  @PostMapping("/auth/verify-preview")
  public Map<String, Object> verify(
      @RequestBody Map<String, Object> b, HttpServletRequest r, HttpServletResponse s) {
    rate.check("verify:" + r.getRemoteAddr(), 15);
    var user = auth.verify(b);
    auth.session(user, s);
    return map("user", user);
  }

  @GetMapping("/account/privacy")
  public Map<String, Object> privacy(HttpServletRequest r) {
    return auth.privacy(auth.require(r), null);
  }

  @PutMapping("/account/privacy")
  public Map<String, Object> privacySave(@RequestBody Map<String, Object> b, HttpServletRequest r) {
    return auth.privacy(auth.require(r), b);
  }

  @GetMapping("/owner/insights")
  public Map<String, Object> insights(HttpServletRequest r) {
    return auth.insights(auth.require(r));
  }
}
