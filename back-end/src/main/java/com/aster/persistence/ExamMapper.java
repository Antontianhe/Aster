package com.aster.persistence;

import java.util.*;
import org.apache.ibatis.annotations.*;

@Mapper
public interface ExamMapper {
  @Select(
      "SELECT id,plan FROM mock_exam_plans WHERE blueprint IS NULL AND deleted_at IS NULL AND"
          + " exam_date<=DATE_ADD(#{today},INTERVAL 1 DAY)")
  List<Map<String, Object>> due(String today);

  @Select(
      "SELECT id,plan,blueprint,result,generated_at AS generatedAt FROM mock_exam_plans WHERE"
          + " user_id=#{user} AND deleted_at IS NULL ORDER BY exam_date,created_at")
  List<Map<String, Object>> list(String user);

  @Select("SELECT COUNT(*) FROM mock_exam_plans WHERE user_id=#{user} AND deleted_at IS NULL")
  int count(String user);

  @Insert(
      "INSERT INTO mock_exam_plans(id,user_id,exam_date,plan)"
          + " VALUES(#{id},#{user},#{date},#{plan})")
  void add(
      @Param("id") String id,
      @Param("user") String user,
      @Param("date") String date,
      @Param("plan") String plan);

  @Select(
      "SELECT plan,blueprint,result FROM mock_exam_plans WHERE id=#{id} AND user_id=#{user} AND"
          + " deleted_at IS NULL")
  Map<String, Object> find(@Param("id") String id, @Param("user") String user);

  @Update(
      "UPDATE mock_exam_plans SET blueprint=#{blueprint},generated_at=UTC_TIMESTAMP() WHERE"
          + " id=#{id} AND blueprint IS NULL AND deleted_at IS NULL")
  void generate(@Param("id") String id, @Param("blueprint") String blueprint);

  @Update(
      "UPDATE mock_exam_plans SET deleted_at=UTC_TIMESTAMP() WHERE id=#{id} AND user_id=#{user}")
  void remove(@Param("id") String id, @Param("user") String user);

  @Update(
      "UPDATE mock_exam_plans SET result=#{result} WHERE id=#{id} AND user_id=#{user} AND result IS"
          + " NULL AND deleted_at IS NULL")
  int submit(@Param("id") String id, @Param("user") String user, @Param("result") String result);
}
