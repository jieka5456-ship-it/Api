// src/db/schemaMap.ts

import { SCHEMA_A } from "../Business/Schema";

// 统一注册：项目 -> schema 集合
export const SCHEMA_MAP = {
  a: SCHEMA_A,
  b: {},
  c: {}, // 预留
  d: {},
  e: {},
} as const;
