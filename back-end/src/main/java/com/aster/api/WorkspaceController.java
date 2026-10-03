package com.aster.api;

import static com.aster.util.Json.*;

import com.aster.persistence.WorkspaceMapper;
import com.aster.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class WorkspaceController {
  private final AuthService auth;
  private final WorkspaceMapper db;

  public WorkspaceController(AuthService auth, WorkspaceMapper db) {
    this.auth = auth;
    this.db = db;
  }

  @GetMapping({"/workspace", "/portal"})
  public Map<String, Object> get(HttpServletRequest r) {
    String id = auth.require(r);
    String raw;
    if (r.getRequestURI().endsWith("/portal")) raw = db.portal(id);
    else {
      var row = db.selectById(id);
      raw = row == null ? null : row.content;
    }
    return map("data", raw == null ? map() : parse(raw));
  }

  @PutMapping({"/workspace", "/portal"})
  public Map<String, Object> save(@RequestBody Map<String, Object> b, HttpServletRequest r) {
    String id = auth.require(r);
    if (!(b.get("data") instanceof Map)) throw ApiException.bad("Send a data object.");
    var data = obj(b.get("data"));
    boolean portal = r.getRequestURI().endsWith("/portal");
    if (!portal)
      for (var e : data.entrySet())
        if (!(e.getKey().startsWith("aster-") || e.getKey().startsWith("dinostudy-"))
            || !(e.getValue() instanceof String s)
            || s.length() > 500000) throw ApiException.bad("Invalid workspace data.");
    if (portal) db.savePortal(id, write(data));
    else db.save(id, write(data));
    return map("ok", true);
  }
}
