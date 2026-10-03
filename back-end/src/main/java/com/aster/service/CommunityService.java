package com.aster.service;

import static com.aster.util.Json.*;

import com.aster.api.ApiException;
import com.aster.persistence.CommunityMapper;
import java.time.Instant;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class CommunityService {
  public static final Set<String> ROOMS = Set.of("general", "igcse", "ib", "homework");
  private final CommunityMapper db;

  public CommunityService(CommunityMapper db) {
    this.db = db;
  }

  public static Map<String, Object> validate(Map<String, Object> b) {
    String room = str(b.get("room")),
        content = str(b.get("content")).trim(),
        clientId = str(b.get("clientId"));
    if (!ROOMS.contains(room)) throw ApiException.bad("Choose a discussion room.");
    if (content.isEmpty() || content.length() > 2000)
      throw ApiException.bad("Write between 1 and 2,000 characters.");
    if (!clientId.matches("(?i)[a-f0-9-]{36}"))
      throw ApiException.bad("Please reload before sending.");
    String reply = b.get("replyId") == null ? null : String.valueOf(b.get("replyId"));
    if (reply != null && !reply.matches("[1-9][0-9]{0,15}"))
      throw ApiException.bad("Invalid reply.");
    return map("room", room, "content", content, "clientId", clientId, "replyId", reply);
  }

  public Map<String, Object> list(String room, String before) {
    if (!ROOMS.contains(room)) throw new ApiException(404, "Room not found.");
    var rows = db.list(room, before != null && before.matches("[1-9][0-9]{0,15}") ? before : null);
    boolean older = rows.size() > 80;
    var selected = new ArrayList<>(rows.subList(0, Math.min(rows.size(), 80)));
    Collections.reverse(selected);
    return map("messages", selected, "hasOlder", older, "serverTime", Instant.now().toString());
  }

  public Map<String, Object> post(String user, Map<String, Object> b) {
    var v = validate(b);
    if (v.get("replyId") != null) {
      var parent = db.find(str(v.get("replyId")));
      if (parent == null
          || parent.get("deleted_at") != null
          || !parent.get("room").equals(v.get("room")))
        throw ApiException.bad("That message can no longer be replied to.");
    }
    v.put("user", user);
    db.post(v);
    return list(str(v.get("room")), null);
  }

  public Map<String, Object> change(String user, String id, Map<String, Object> b) {
    if (!id.matches("[1-9][0-9]{0,15}")) throw new ApiException(404, "Message not found.");
    var row = db.find(id);
    if (row == null || !user.equals(row.get("user_id")))
      throw new ApiException(403, "You can only change your own messages.");
    String action = str(b.get("action"));
    if (action.equals("remove")) db.remove(id, user);
    else if (action.equals("restore")) db.restore(id, user);
    else {
      String content = str(b.get("content")).trim();
      if (row.get("deleted_at") != null || content.isEmpty() || content.length() > 2000)
        throw ApiException.bad("Write between 1 and 2,000 characters.");
      db.edit(id, user, content);
    }
    return map("ok", true);
  }

  public Map<String, Object> report(String user, String id, String reason) {
    if (!Set.of("Unkind or abusive", "Spam", "Personal information", "Other concern")
        .contains(reason)) throw ApiException.bad("Choose a report reason.");
    if (!id.matches("[1-9][0-9]{0,15}") || db.find(id) == null)
      throw new ApiException(404, "Message not found.");
    db.report(id, user, reason);
    return map("ok", true);
  }
}
