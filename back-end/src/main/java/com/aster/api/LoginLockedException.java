package com.aster.api;

public class LoginLockedException extends ApiException {
  public final long retryAfterSeconds;

  public LoginLockedException(long retryAfterSeconds) {
    super(429, "Five incorrect passwords in a row. Sign-in is paused for five minutes.");
    this.retryAfterSeconds = Math.max(1, retryAfterSeconds);
  }
}
