package com.aster.persistence;

import com.baomidou.mybatisplus.annotation.*;

@TableName("workspace_state")
public class WorkspaceEntity {
  @TableId(type = IdType.INPUT)
  public String userId;

  public String content;
}
