package com.aster.api;

import com.aster.security.RateLimiter;
import com.aster.service.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AiController {
  private final AiProvider ai;
  private final TutorService tutor;
  private final ExamCoachService coach;
  private final RateLimiter rate;
  private final AtomicBoolean busy = new AtomicBoolean();

  public AiController(AiProvider ai, TutorService tutor, ExamCoachService coach, RateLimiter rate) {
    this.ai = ai;
    this.tutor = tutor;
    this.coach = coach;
    this.rate = rate;
  }

  @GetMapping("/ai/status")
  public Map<String, Object> status() {
    return ai.status();
  }

  @PostMapping("/ai/chat")
  public Map<String, Object> chat(@RequestBody Map<String, Object> b, HttpServletRequest r) {
    rate.check("ai:" + r.getRemoteAddr(), 12);
    lock();
    try {
      return tutor.chat(b);
    } finally {
      busy.set(false);
    }
  }

  @PostMapping("/exam-coach/{phase}")
  public Map<String, Object> coach(
      @PathVariable String phase, @RequestBody Map<String, Object> b, HttpServletRequest r) {
    rate.check("coach:" + r.getRemoteAddr(), 5);
    lock();
    try {
      return coach.analyse(b, phase);
    } finally {
      busy.set(false);
    }
  }

  private void lock() {
    if (!busy.compareAndSet(false, true))
      throw new ApiException(429, "Your buddy is finishing another reply. Try again in a moment.");
  }
}
