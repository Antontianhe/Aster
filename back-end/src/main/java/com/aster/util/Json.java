package com.aster.util;

import com.fasterxml.jackson.databind.*;
import java.util.*;

public final class Json {
  public static final ObjectMapper MAPPER = new ObjectMapper().findAndRegisterModules();

  private Json() {}

  @SuppressWarnings("unchecked")
  public static Map<String, Object> obj(Object value) {
    return value instanceof Map ? (Map<String, Object>) value : new LinkedHashMap<>();
  }

  @SuppressWarnings("unchecked")
  public static List<Object> list(Object value) {
    return value instanceof List ? (List<Object>) value : List.of();
  }

  public static String str(Object value) {
    return value instanceof String s ? s : "";
  }

  public static String text(Object value, int max) {
    String s = str(value).trim();
    return s.substring(0, Math.min(max, s.length()));
  }

  public static Object parse(Object raw) {
    if (raw == null) return null;
    if (!(raw instanceof String s)) return raw;
    try {
      return MAPPER.readValue(s, Object.class);
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid stored JSON");
    }
  }

  public static String write(Object value) {
    try {
      return MAPPER.writeValueAsString(value);
    } catch (Exception ex) {
      throw new IllegalArgumentException("Invalid JSON value");
    }
  }

  public static Map<String, Object> map(Object... entries) {
    Map<String, Object> result = new LinkedHashMap<>();
    for (int i = 0; i < entries.length; i += 2) result.put((String) entries[i], entries[i + 1]);
    return result;
  }

  public static boolean integer(Object v) {
    return v instanceof Number n
        && Double.isFinite(n.doubleValue())
        && n.doubleValue() == Math.rint(n.doubleValue());
  }

  public static long number(Object v) {
    return v instanceof Number n ? n.longValue() : 0;
  }

  public static boolean bool(Object v) {
    return Boolean.TRUE.equals(v) || v instanceof Number n && n.intValue() != 0;
  }
}
