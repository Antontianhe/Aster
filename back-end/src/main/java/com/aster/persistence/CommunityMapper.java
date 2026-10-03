package com.aster.persistence;

import java.util.*;
import org.apache.ibatis.annotations.*;

@Mapper
public interface CommunityMapper {
  String FIELDS =
      "SELECT m.id,m.user_id AS userId,m.room,IF(m.deleted_at IS NULL,m.content,'') AS"
          + " content,m.created_at AS createdAt,m.edited_at AS editedAt,m.deleted_at AS"
          + " deletedAt,c.username,u.display_name AS name,m.reply_id AS replyId,IF(p.deleted_at IS"
          + " NULL,LEFT(p.content,140),'Message removed') AS replyText,pc.username AS replyUsername"
          + " FROM community_messages m JOIN users u ON u.id=m.user_id JOIN credentials c ON"
          + " c.user_id=m.user_id LEFT JOIN community_messages p ON p.id=m.reply_id LEFT JOIN"
          + " credentials pc ON pc.user_id=p.user_id";

  @Select(
      "<script>"
          + FIELDS
          + " WHERE m.room=#{room}<if test='before != null'> AND m.id &lt; #{before}</if> ORDER BY"
          + " m.id DESC LIMIT 81</script>")
  List<Map<String, Object>> list(@Param("room") String room, @Param("before") String before);

  @Select("SELECT id,user_id,room,deleted_at FROM community_messages WHERE id=#{id}")
  Map<String, Object> find(String id);

  @Insert(
      "INSERT INTO community_messages(user_id,client_id,room,content,reply_id)"
          + " VALUES(#{user},#{clientId},#{room},#{content},#{replyId}) ON DUPLICATE KEY UPDATE"
          + " client_id=VALUES(client_id)")
  void post(Map<String, Object> message);

  @Update(
      "UPDATE community_messages SET deleted_at=UTC_TIMESTAMP(3) WHERE id=#{id} AND"
          + " user_id=#{user}")
  void remove(@Param("id") String id, @Param("user") String user);

  @Update("UPDATE community_messages SET deleted_at=NULL WHERE id=#{id} AND user_id=#{user}")
  void restore(@Param("id") String id, @Param("user") String user);

  @Update(
      "UPDATE community_messages SET content=#{content},edited_at=UTC_TIMESTAMP(3) WHERE id=#{id}"
          + " AND user_id=#{user}")
  void edit(@Param("id") String id, @Param("user") String user, @Param("content") String content);

  @Insert(
      "INSERT INTO community_reports(message_id,user_id,reason) VALUES(#{id},#{user},#{reason}) ON"
          + " DUPLICATE KEY UPDATE reason=VALUES(reason)")
  void report(@Param("id") String id, @Param("user") String user, @Param("reason") String reason);
}
