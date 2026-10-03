package com.aster.security;

import com.aster.api.ApiException;
import java.util.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class RateLimiter {
  private final Map<String, Deque<Long>> hits = new HashMap<>();

  public synchronized void check(String key, int limit) {
    long now = System.currentTimeMillis();
    var queue = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
    while (!queue.isEmpty() && queue.peekFirst() < now - 60000) queue.removeFirst();
    if (queue.size() >= limit)
      throw new ApiException(429, "Please wait a minute before trying again.");
    queue.addLast(now);
  }

  @Scheduled(fixedDelay = 60000)
  public synchronized void clean() {
    long cutoff = System.currentTimeMillis() - 60000;
    hits.entrySet().removeIf(e -> e.getValue().isEmpty() || e.getValue().peekLast() < cutoff);
  }
}
