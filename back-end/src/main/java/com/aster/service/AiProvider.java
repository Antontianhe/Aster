package com.aster.service;

import static com.aster.util.Json.*;

import com.aster.api.ApiException;
import com.aster.config.LocalSettings;
import java.net.*;
import java.net.http.*;
import java.time.Duration;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AiProvider {
  public static final String CLOUD_MODEL = "gpt-6-astra";

  public record Reply(String content, String model, boolean local) {}

  public record Response(int status, Map<String, Object> data) {}

  @FunctionalInterface
  public interface Transport {
    Response send(String url, Map<String, String> headers, Map<String, Object> body, int seconds)
        throws Exception;
  }

  private final String key;
  private final boolean enabled;
  private final Transport transport;

  @Autowired
  public AiProvider(LocalSettings settings) {
    this(
        settings.get("OPENAI_API_KEY", "").trim(),
        "true".equals(settings.get("ASTER_OPENAI_ENABLED", "false")),
        AiProvider::request);
  }

  public AiProvider(String key, boolean enabled, Transport transport) {
    this.key = key;
    this.enabled = enabled && !key.isBlank();
    this.transport = transport;
  }

  private static final HttpClient HTTP =
      HttpClient.newBuilder()
          .connectTimeout(Duration.ofSeconds(10))
          .followRedirects(HttpClient.Redirect.NEVER)
          .build();

  private static Response request(
      String url, Map<String, String> headers, Map<String, Object> body, int seconds)
      throws Exception {
    var request = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(seconds));
    headers.forEach(request::header);
    if (body == null) request.GET();
    else
      request
          .POST(HttpRequest.BodyPublishers.ofString(write(body)))
          .header("Content-Type", "application/json");
    var response = HTTP.send(request.build(), HttpResponse.BodyHandlers.ofString());
    Map<String, Object> data;
    try {
      data = obj(parse(response.body()));
    } catch (Exception e) {
      data = map();
    }
    return new Response(response.statusCode(), data);
  }

  public Map<String, Object> cloudStatus() {
    return map("configured", !key.isBlank(), "ready", enabled, "model", CLOUD_MODEL);
  }

  public Map<String, Object> status() {
    boolean ready = false;
    try {
      var response = transport.send("http://127.0.0.1:11434/api/tags", Map.of(), null, 2);
      ready =
          response.status == 200
              && list(response.data.get("models")).stream()
                  .map(com.aster.util.Json::obj)
                  .anyMatch(m -> "qwen3.5:2b".equals(m.get("name")));
    } catch (Exception ignored) {
    }
    return map("ready", ready, "model", "Qwen 3.5 · 2B", "local", true, "cloud", cloudStatus());
  }

  public Reply complete(
      String provider,
      boolean consent,
      List<Object> messages,
      Object schema,
      int tokens,
      int seconds) {
    if (provider == null || provider.isBlank()) provider = "local";
    if (!Set.of("local", "openai").contains(provider))
      throw ApiException.bad("Choose Local AI or OpenAI.");
    boolean cloud = provider.equals("openai");
    if (cloud && !enabled)
      throw new ApiException(
          503, "OpenAI is disabled. Configure a server API key and enable cloud AI locally first.");
    if (cloud && !consent)
      throw ApiException.bad("Confirm that you want to send this content to OpenAI.");
    Map<String, Object> body;
    if (cloud) {
      var input = new ArrayList<>();
      for (Object raw : messages) {
        var m = obj(raw);
        Object content = m.get("content");
        if (!list(m.get("images")).isEmpty()) {
          var parts = new ArrayList<>();
          parts.add(map("type", "input_text", "text", content));
          for (Object image : list(m.get("images")))
            parts.add(
                map(
                    "type",
                    "input_image",
                    "image_url",
                    str(image).startsWith("data:") ? image : "data:image/jpeg;base64," + image));
          content = parts;
        }
        input.add(map("role", m.get("role"), "content", content));
      }
      body =
          map(
              "model",
              CLOUD_MODEL,
              "input",
              input,
              "store",
              false,
              "reasoning",
              map("effort", "medium"),
              "max_output_tokens",
              Math.max(4000, tokens));
      if (schema != null)
        body.put(
            "text",
            map(
                "format",
                map(
                    "type",
                    "json_schema",
                    "name",
                    "exam_coach",
                    "strict",
                    true,
                    "schema",
                    schema)));
    } else {
      var input = new ArrayList<>();
      for (Object raw : messages) {
        var m = new LinkedHashMap<>(obj(raw));
        if (m.containsKey("images"))
          m.put(
              "images",
              list(m.get("images")).stream()
                  .map(
                      i -> {
                        String s = str(i);
                        return s.contains(",") ? s.substring(s.indexOf(',') + 1) : s;
                      })
                  .toList());
        input.add(m);
      }
      body =
          map(
              "model",
              "qwen3.5:2b",
              "stream",
              false,
              "think",
              false,
              "messages",
              input,
              "options",
              map(
                  "num_ctx",
                  schema == null ? 4096 : 8192,
                  "num_predict",
                  tokens,
                  "temperature",
                  schema == null ? .35 : 0));
      if (schema != null) body.put("format", schema);
    }
    Response response;
    try {
      response =
          transport.send(
              cloud ? "https://api.openai.com/v1/responses" : "http://127.0.0.1:11434/api/chat",
              cloud ? Map.of("Authorization", "Bearer " + key) : Map.of(),
              body,
              seconds);
    } catch (Exception e) {
      if (e instanceof InterruptedException) Thread.currentThread().interrupt();
      throw new ApiException(
          503,
          cloud
              ? "OpenAI could not be reached. Your request was not switched to another provider."
              : "The local AI is unavailable or took too long. Check that Ollama is running and try"
                    + " a shorter question.");
    }
    if (response.status < 200 || response.status >= 300)
      throw new ApiException(
          response.status == 429 ? 429 : 503,
          cloud
              ? (response.status == 401
                  ? "The configured OpenAI key was not accepted."
                  : response.status == 429
                      ? "OpenAI rate or billing limit reached. Check your API account."
                      : "OpenAI could not complete this request. Check model access and your API"
                            + " account.")
              : "The local model is not ready. Check that Ollama is running.");
    if (!cloud) {
      String content = str(obj(response.data.get("message")).get("content"));
      if (content.isEmpty()) throw new ApiException(502, "The local model returned no answer.");
      return new Reply(content, "qwen3.5:2b", true);
    }
    if ("incomplete".equals(response.data.get("status")))
      throw new ApiException(502, "The OpenAI response was incomplete. Try a shorter request.");
    var content = new ArrayList<String>();
    for (Object out : list(response.data.get("output")))
      for (Object part : list(obj(out).get("content"))) {
        var p = obj(part);
        if ("refusal".equals(p.get("type")))
          throw new ApiException(
              422, "The AI could not help with this request. Try a different study question.");
        if ("output_text".equals(p.get("type"))) content.add(str(p.get("text")));
      }
    String answer = String.join("\n", content).trim();
    if (answer.isEmpty())
      throw new ApiException(502, "OpenAI returned no answer. Please try again.");
    return new Reply(answer, str(response.data.getOrDefault("model", CLOUD_MODEL)), false);
  }
}
