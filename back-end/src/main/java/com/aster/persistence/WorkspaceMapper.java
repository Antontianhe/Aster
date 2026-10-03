package com.aster.persistence;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.*;

@Mapper
public interface WorkspaceMapper extends BaseMapper<WorkspaceEntity> {
  @Insert(
      "INSERT INTO workspace_state(user_id,content) VALUES(#{id},#{content}) ON DUPLICATE KEY"
          + " UPDATE content=VALUES(content)")
  void save(@Param("id") String id, @Param("content") String content);

  @Select("SELECT content FROM portal_records WHERE user_id=#{id}")
  String portal(String id);

  @Insert(
      "INSERT INTO portal_records(user_id,content) VALUES(#{id},#{content}) ON DUPLICATE KEY UPDATE"
          + " content=VALUES(content)")
  void savePortal(@Param("id") String id, @Param("content") String content);
}
