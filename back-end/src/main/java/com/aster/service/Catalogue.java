package com.aster.service;

import static com.aster.util.Json.*;

import java.util.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

@Component
public class Catalogue {
  public final List<Object> curriculum, algebra;
  public final Map<String, Object> courses, units;

  public Catalogue() throws Exception {
    try (var stream = new ClassPathResource("catalogue.json").getInputStream()) {
      var data = obj(MAPPER.readValue(stream, Object.class));
      courses = obj(data.get("courses"));
      curriculum = list(data.get("curriculum"));
      units = obj(data.get("units"));
      algebra = list(data.get("verifiedAlgebra"));
    }
  }

  public Map<String, Object> course(Object id) {
    return curriculum.stream()
        .map(com.aster.util.Json::obj)
        .filter(c -> Objects.equals(c.get("id"), id))
        .findFirst()
        .orElse(map());
  }
}
