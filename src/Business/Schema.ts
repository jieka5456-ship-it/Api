// src/projects/a/schema.ts

export const SCHEMA_A = {
  // ---- Team订单管理 ----
  TeamOrder: {
    table: "TeamOrder",
    primaryKey: "ID",
    // 新增允许写入的字段（不含 ID）
    insertable: ["Email","TeamID","TeamState","TeamCard","AddTime","ExyTime",] as const,
    // 新增必填字段
    required: ["Email","TeamID","TeamState","TeamCard","AddTime","ExyTime",] as const,
    // 查询允许返回的字段（可包含 ID）
    selectable: [
      "ID","Email","TeamID","TeamState","TeamCard","AddTime","ExyTime",] as const,
   // 允许更新的字段（一般不让改 AddTime；是否允许改 ExyTime 你可按业务调整）
    updatable: ["Email","TeamID","TeamState","TeamCard","ExyTime",] as const,
  },

  // ---- Team卡密管理 ----
  Code: {
    table: "TeamCode",
    primaryKey: "ID",
    // 新增允许写入的字段（不含 ID）
    insertable: ["Card","NumTime","UseState","UseTime",] as const,
    // 新增必填字段
    required: ["Card","NumTime","UseState",] as const,
    // 查询允许返回的字段（可包含 ID）
    selectable: ["ID","Card","NumTime","UseState","UseTime", ] as const,

    // 通常卡密会更新 UseState / UseTime / NumTime（按你业务）
    updatable: ["NumTime","UseState","UseTime",] as const,
  },

  // ---- Team团队管理 ----
  TeamMgmt: {
    table: "TeamMgmt",
    primaryKey: "ID",
    // 新增允许写入的字段（不含 ID）
    insertable: ["TeamEmail","TeamID","TeamToken","TeamState","TeamNum","NumTime","AddTime",] as const,
    // 新增必填字段
    required: ["TeamEmail","TeamID","TeamToken", "TeamState","TeamNum","NumTime",] as const,
    // 查询允许返回的字段（可包含 ID）
    selectable: ["ID","TeamEmail","TeamID","TeamToken","TeamState","TeamNum","NumTime","AddTime",] as const,
  // 通常允许更新状态/人数/服务时长/Token（按你业务）
    updatable: ["TeamEmail", "TeamID", "TeamToken","TeamState", "TeamNum", "NumTime",] as const,
  },
} as const;

export type SchemaKeyA = keyof typeof SCHEMA_A;
