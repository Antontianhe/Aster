package com.aster.api;

import static com.aster.util.Json.str;

import com.aster.security.RateLimiter;
import com.aster.service.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/community")
public class CommunityController {
  private final AuthService auth;
  private final CommunityService service;
  private final RateLimiter rate;

  public CommunityController(AuthService auth, CommunityService service, RateLimiter rate) {
    this.auth = auth;
    this.service = service;
    this.rate = rate;
  }

  @GetMapping
  public Map<String, Object> list(
      @RequestParam(defaultValue = "general") String room,
      @RequestParam(required = false) String before,
      HttpServletRequest r) {
    auth.require(r);
    return service.list(room, before);
  }

  @PostMapping
  public Map<String, Object> post(@RequestBody Map<String, Object> b, HttpServletRequest r) {
    String id = auth.require(r);
    rate.check("chat:" + id, 20);
    return service.post(id, b);
  }

  @PatchMapping("/{message}")
  public Map<String, Object> change(
      @PathVariable String message, @RequestBody Map<String, Object> b, HttpServletRequest r) {
    String id = auth.require(r);
    rate.check("chat-edit:" + id, 30);
    return service.change(id, message, b);
  }

  @PostMapping("/{message}/report")
  public Map<String, Object> report(
      @PathVariable String message, @RequestBody Map<String, Object> b, HttpServletRequest r) {
    String id = auth.require(r);
    rate.check("chat-report:" + id, 10);
    return service.report(id, message, str(b.get("reason")));
  }
}
