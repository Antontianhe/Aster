package com.aster.service;

import static com.aster.util.Json.*;

import com.aster.api.ApiException;
import com.aster.config.LocalSettings;
import com.aster.persistence.FeedMapper;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class FeedService {
  private final FeedMapper db;
  private final byte[] key;
  private final HttpClient http =
      HttpClient.newBuilder()
          .connectTimeout(Duration.ofSeconds(10))
          .followRedirects(HttpClient.Redirect.NEVER)
          .build();
  private final Set<String> busy = ConcurrentHashMap.newKeySet();

  public FeedService(FeedMapper db, LocalSettings settings) throws Exception {
    this.db = db;
    Path file = settings.instance().resolve("feed-encryption.key");
    if (!Files.exists(file)) {
      byte[] bytes = new byte[32];
      new SecureRandom().nextBytes(bytes);
      Files.write(file, bytes, StandardOpenOption.CREATE_NEW);
    }
    key = Files.readAllBytes(file);
    if (key.length != 32) throw new IllegalStateException("Invalid private feed key.");
  }

  private Map<String, Object> download(String url, String etag) throws Exception {
    var b =
        HttpRequest.newBuilder(FeedCodec.validate(url))
            .timeout(Duration.ofSeconds(20))
            .header("Accept", "application/rss+xml,application/xml,text/xml");
    if (etag != null && !etag.isEmpty()) b.header("If-None-Match", etag);
    var response = http.send(b.GET().build(), HttpResponse.BodyHandlers.ofInputStream());
    try (var body = response.body()) {
      if (response.statusCode() == 304) return map("unchanged", true);
      if (response.statusCode() != 200)
        throw new IllegalArgumentException("Schoolbox is unavailable.");
      byte[] bytes = body.readNBytes(2_000_001);
      if (bytes.length > 2_000_000)
        throw new IllegalArgumentException("The school feed is too large.");
      return map(
          "items",
          FeedCodec.parseFeed(new String(bytes, StandardCharsets.UTF_8)),
          "etag",
          text(response.headers().firstValue("etag").orElse(""), 500));
    }
  }

  public Map<String, Object> get(String id) {
    var row = db.find(id);
    return map(
        "connected",
        row != null,
        "items",
        row == null || row.get("cached_items") == null ? List.of() : parse(row.get("cached_items")),
        "checkedAt",
        row == null ? null : row.get("checked_at"),
        "error",
        row == null ? null : row.get("last_error"),
        "intervalSeconds",
        60);
  }

  public Map<String, Object> connect(String id, String url) {
    try {
      String valid = FeedCodec.validate(url).toString();
      var result = download(valid, null);
      db.connect(
          id, FeedCodec.encrypt(valid, key), write(result.get("items")), str(result.get("etag")));
      return get(id);
    } catch (Exception e) {
      throw ApiException.bad(
          "Could not connect this private feed. Check the Schoolbox RSS link and try again.");
    }
  }

  public Map<String, Object> disconnect(String id) {
    db.delete(id);
    return map("connected", false, "items", List.of());
  }

  public Map<String, Object> refresh(String id) {
    var row = db.find(id);
    if (row != null
        && (row.get("checked_at") == null
            || row.get("checked_at") instanceof java.util.Date date
                && System.currentTimeMillis() - date.getTime() > 30000)) refreshRow(row);
    return get(id);
  }

  private void refreshRow(Map<String, Object> row) {
    String id = str(row.get("user_id"));
    if (!busy.add(id)) return;
    try {
      var result =
          download(FeedCodec.decrypt(str(row.get("url_encrypted")), key), str(row.get("etag")));
      if (bool(result.get("unchanged"))) db.unchanged(id);
      else db.update(id, write(result.get("items")), str(result.get("etag")));
    } catch (Exception e) {
      db.error(
          id, "Schoolbox could not be refreshed. Your last successful update is still available.");
    } finally {
      busy.remove(id);
    }
  }

  @Scheduled(fixedDelay = 60000, initialDelay = 10000)
  public void poll() {
    try {
      for (var row : db.all()) refreshRow(row);
    } catch (Exception ignored) {
    }
  }
}
