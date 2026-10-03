package com.aster.persistence;

import com.baomidou.mybatisplus.annotation.*;

@TableName("users")
public class UserEntity {
  @TableId(type = IdType.INPUT)
  public String id;

  public String displayName;

  public UserEntity() {}

  public UserEntity(String id, String name) {
    this.id = id;
    this.displayName = name;
  }
}
