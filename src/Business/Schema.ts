//数据库白名单
// src/Business/Schema.ts
export const BusinessSchema = {
  table: "PlucCode",
  insertable: ["Card", "NumTime", "UseState", "UseTime"] as const,
};
