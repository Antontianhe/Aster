package com.aster.persistence;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import java.util.*;
import org.apache.ibatis.annotations.*;

@Mapper
public interface AuthMapper extends BaseMapper<UserEntity> {
  @Insert("INSERT INTO workspace_state(user_id,content) VALUES(#{id},#{content})")
  void initialWorkspace(@Param("id") String id, @Param("content") String content);
  @Select("SELECT 1")
  int ping();

  @Select(
      "SELECT u.id,u.display_name AS name,c.username FROM auth_sessions s JOIN users u ON"
          + " u.id=s.user_id JOIN credentials c ON c.user_id=u.id WHERE s.token_hash=#{hash} AND"
          + " s.expires_at>UTC_TIMESTAMP()")
  Map<String, Object> session(String hash);

  @Select(
      "SELECT u.id,u.display_name AS name,c.username,c.password_hash AS passwordHash FROM"
          + " credentials c JOIN users u ON u.id=c.user_id WHERE c.username=#{username}")
  Map<String, Object> login(String username);

  @Insert(
      "INSERT INTO credentials(user_id,username,password_hash) VALUES(#{id},#{username},#{hash})")
  void credentials(
      @Param("id") String id, @Param("username") String username, @Param("hash") String hash);

  @Insert(
      "INSERT INTO auth_sessions(token_hash,user_id,expires_at)"
          + " VALUES(#{hash},#{id},DATE_ADD(UTC_TIMESTAMP(),INTERVAL 1 DAY))")
  void newSession(@Param("hash") String hash, @Param("id") String id);

  @Delete("DELETE FROM auth_sessions WHERE token_hash=#{hash}")
  void logout(String hash);

  @Delete("DELETE FROM auth_sessions WHERE expires_at<UTC_TIMESTAMP()")
  void expireSessions();

  @Insert(
      "INSERT INTO account_preferences(user_id,contact,channel,terms_version)"
          + " VALUES(#{id},#{contact},#{channel},'2026-09-20-preview')")
  void preferences(
      @Param("id") String id, @Param("contact") String contact, @Param("channel") String channel);

  @Select(
      "SELECT contact,channel,preview_verified_at AS verified,analytics_opt_in AS"
          + " analytics,progress_sharing AS sharing,consent_updated_at AS updatedAt FROM"
          + " account_preferences WHERE user_id=#{id}")
  Map<String, Object> preferencesFor(String id);

  @Delete("DELETE FROM verification_challenges WHERE user_id=#{id}")
  void clearChallenges(String id);

  @Insert(
      "INSERT INTO verification_challenges(token_hash,user_id,code_hash,expires_at)"
          + " VALUES(#{token},#{id},#{code},DATE_ADD(UTC_TIMESTAMP(),INTERVAL 10 MINUTE))")
  void challenge(@Param("token") String token, @Param("id") String id, @Param("code") String code);

  @Select(
      "SELECT token_hash,user_id,code_hash,attempts,(expires_at>UTC_TIMESTAMP()) AS active FROM"
          + " verification_challenges WHERE token_hash=#{hash} FOR UPDATE")
  Map<String, Object> challengeForUpdate(String hash);

  @Update("UPDATE verification_challenges SET attempts=attempts+1 WHERE token_hash=#{hash}")
  void failedAttempt(String hash);

  @Update("UPDATE account_preferences SET preview_verified_at=UTC_TIMESTAMP() WHERE user_id=#{id}")
  void verified(String id);

  @Select(
      "SELECT u.id,u.display_name AS name,c.username FROM users u JOIN credentials c ON"
          + " c.user_id=u.id WHERE u.id=#{id}")
  Map<String, Object> user(String id);

  @Insert(
      "INSERT INTO"
          + " account_preferences(user_id,contact,channel,terms_version,preview_verified_at,analytics_opt_in,progress_sharing,consent_updated_at)"
          + " VALUES(#{id},'','email','legacy-account',UTC_TIMESTAMP(),#{analytics},#{sharing},UTC_TIMESTAMP())"
          + " ON DUPLICATE KEY UPDATE"
          + " analytics_opt_in=VALUES(analytics_opt_in),progress_sharing=VALUES(progress_sharing),consent_updated_at=UTC_TIMESTAMP()")
  void privacy(
      @Param("id") String id,
      @Param("analytics") boolean analytics,
      @Param("sharing") boolean sharing);

  @Select("SELECT COUNT(*) FROM account_roles WHERE user_id=#{id} AND role='owner'")
  int owner(String id);

  @Select(
      "SELECT u.id,u.display_name AS name,p.analytics_opt_in AS analytics,p.progress_sharing AS"
          + " sharing,w.content FROM users u JOIN account_preferences p ON p.user_id=u.id LEFT JOIN"
          + " workspace_state w ON w.user_id=u.id WHERE p.analytics_opt_in=TRUE OR"
          + " p.progress_sharing=TRUE")
  List<Map<String, Object>> insights();
}
