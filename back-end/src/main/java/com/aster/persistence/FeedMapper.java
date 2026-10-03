package com.aster.persistence;

import java.util.*;
import org.apache.ibatis.annotations.*;

@Mapper
public interface FeedMapper {
  @Select("SELECT * FROM school_feeds WHERE user_id=#{id}")
  Map<String, Object> find(String id);

  @Select("SELECT user_id,url_encrypted,etag,checked_at FROM school_feeds")
  List<Map<String, Object>> all();

  @Insert(
      "INSERT INTO school_feeds(user_id,url_encrypted,cached_items,checked_at,etag)"
          + " VALUES(#{id},#{encrypted},#{items},UTC_TIMESTAMP(),#{etag}) ON DUPLICATE KEY UPDATE"
          + " url_encrypted=VALUES(url_encrypted),cached_items=VALUES(cached_items),checked_at=UTC_TIMESTAMP(),etag=VALUES(etag),last_error=NULL")
  void connect(
      @Param("id") String id,
      @Param("encrypted") String encrypted,
      @Param("items") String items,
      @Param("etag") String etag);

  @Update("UPDATE school_feeds SET checked_at=UTC_TIMESTAMP(),last_error=NULL WHERE user_id=#{id}")
  void unchanged(String id);

  @Update(
      "UPDATE school_feeds SET"
          + " cached_items=#{items},etag=#{etag},checked_at=UTC_TIMESTAMP(),last_error=NULL WHERE"
          + " user_id=#{id}")
  void update(@Param("id") String id, @Param("items") String items, @Param("etag") String etag);

  @Update("UPDATE school_feeds SET last_error=#{error} WHERE user_id=#{id}")
  void error(@Param("id") String id, @Param("error") String error);

  @Delete("DELETE FROM school_feeds WHERE user_id=#{id}")
  void delete(String id);
}
