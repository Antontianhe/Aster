package com.aster.api;

import static com.aster.util.Json.str;

import com.aster.security.RateLimiter;
import com.aster.service.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/school-news")
public class FeedController {
  private final AuthService auth;
  private final FeedService service;
  private final RateLimiter rate;

  public FeedController(AuthService auth, FeedService service, RateLimiter rate) {
    this.auth = auth;
    this.service = service;
    this.rate = rate;
  }

  @GetMapping
  public Map<String, Object> get(HttpServletRequest r) {
    return service.get(auth.require(r));
  }

  @PutMapping
  public Map<String, Object> connect(@RequestBody Map<String, Object> b, HttpServletRequest r) {
    String id = auth.require(r);
    rate.check("feed:" + id, 3);
    return service.connect(id, str(b.get("url")));
  }

  @PostMapping
  public Map<String, Object> refresh(HttpServletRequest r) {
    return service.refresh(auth.require(r));
  }

  @DeleteMapping
  public Map<String, Object> disconnect(HttpServletRequest r) {
    return service.disconnect(auth.require(r));
  }
}
