package com.aster.api;

import java.util.Map;
import org.slf4j.*;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class ApiErrors {
  private static final Logger LOG = LoggerFactory.getLogger(ApiErrors.class);

  @ExceptionHandler(LoginLockedException.class)
  public ResponseEntity<?> loginLocked(LoginLockedException ex) {
    return ResponseEntity.status(429)
        .header("Retry-After", String.valueOf(ex.retryAfterSeconds))
        .body(Map.of("error", ex.getMessage(), "code", "LOGIN_LOCKED",
            "retryAfterSeconds", ex.retryAfterSeconds));
  }

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<?> known(ApiException ex) {
    return ResponseEntity.status(ex.status).body(Map.of("error", ex.getMessage()));
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<?> malformed() {
    return ResponseEntity.badRequest().body(Map.of("error", "Send a valid JSON object."));
  }

  @ExceptionHandler(DuplicateKeyException.class)
  public ResponseEntity<?> duplicate() {
    return ResponseEntity.status(409).body(Map.of("error", "That username is already taken."));
  }

  @ExceptionHandler(NoResourceFoundException.class)
  public ResponseEntity<?> missing() {
    return ResponseEntity.status(404).body(Map.of("error", "Not found."));
  }

  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  public ResponseEntity<?> method() {
    return ResponseEntity.status(405).body(Map.of("error", "Method not allowed."));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<?> unexpected(Exception ex) {
    LOG.warn("API operation failed ({})", ex.getClass().getSimpleName());
    return ResponseEntity.status(503)
        .body(
            Map.of(
                "error",
                "The local service is unavailable. Start the Aster services and try again."));
  }
}
