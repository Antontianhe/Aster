package com.aster.api;

import com.aster.security.RateLimiter;
import com.aster.service.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/mock-exams")
public class ExamController {
  private final AuthService auth;
  private final ExamService service;
  private final RateLimiter rate;

  public ExamController(AuthService auth, ExamService service, RateLimiter rate) {
    this.auth = auth;
    this.service = service;
    this.rate = rate;
  }

  @GetMapping
  public Map<String, Object> list(HttpServletRequest r) {
    return service.listExams(auth.require(r));
  }

  @PostMapping
  public Map<String, Object> add(@RequestBody Map<String, Object> b, HttpServletRequest r) {
    String id = auth.require(r);
    rate.check("exam-add:" + id, 10);
    return service.add(id, b);
  }

  @PostMapping("/{exam}")
  public Map<String, Object> action(
      @PathVariable String exam, @RequestBody Map<String, Object> b, HttpServletRequest r) {
    String id = auth.require(r);
    rate.check("exam-action:" + id, 30);
    return service.action(id, exam, b);
  }
}
