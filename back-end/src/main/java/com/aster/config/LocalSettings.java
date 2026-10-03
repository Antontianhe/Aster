package com.aster.config;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import org.springframework.stereotype.Component;

/** Reads the existing private installation; never copies credentials into the repository. */
@Component
public class LocalSettings {
  private final Map<String, String> values = new HashMap<>();
  private final Path instance;

  public LocalSettings() throws IOException {
    String base =
        System.getenv()
            .getOrDefault(
                "ASTER_HOME",
                Path.of(
                        System.getenv()
                            .getOrDefault("LOCALAPPDATA", System.getProperty("user.home")),
                        "Aster")
                    .toString());
    instance = Path.of(base, "mysql-instance");
    Path env = instance.resolve("app.env");
    if (Files.exists(env)) {
      for (String line : Files.readAllLines(env)) {
        int index = line.indexOf('=');
        if (index > 0 && !line.trim().startsWith("#"))
          values.put(line.substring(0, index).trim(), line.substring(index + 1).trim());
      }
    }
    values.putAll(System.getenv());
  }

  public Path instance() {
    return instance;
  }

  public String get(String key, String fallback) {
    return values.getOrDefault(key, fallback);
  }
}
