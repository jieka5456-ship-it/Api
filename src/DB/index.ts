// src/db/insertOne.ts
import { getDB } from "./getDB";
import { SCHEMA_MAP } from "./SchemaMap";
import { JsonFail, JsonOk } from "../Message";

export async function insertOne(
  env: Env,
  parts: string[],
  data: unknown
): Promise<Response> {
  const project = parts[0];    // a
  const schemaKey = parts[3];  // TeamCode / TeamOrder / TeamMgmt

  // 1) 基础参数校验（直接返回，不 throw）
  if (!project) return JsonFail(400, "缺少项目标识", 400);
  if (!schemaKey) return JsonFail(400, "缺少资源名（schemaKey）", 400);
  if (typeof data !== "object" || data === null || Array.isArray(data)) return JsonFail(400, "请求体必须是 JSON 对象", 400);
  // 2) 找项目 schema
  const schemaGroup = (SCHEMA_MAP as any)[project];
  if (!schemaGroup) return JsonFail(400, `未知项目: ${project}`, 400);

  // 3) 找具体表配置（注意：用 schemaKey！）
  const conf = schemaGroup[schemaKey] as
    | { table: string; insertable: readonly string[]; required: readonly string[] }
    | undefined;

  if (!conf) return JsonFail(400, `未知资源: ${project}.${schemaKey}`, 400);
  const obj = data as Record<string, any>;
  // 4) 必填校验
  const missing = conf.required.filter((k) => obj[k] === undefined || obj[k] === null);
  if (missing.length) return JsonFail(400, `缺少必填字段: ${missing.join(", ")}`, 400);

  // 5) 白名单过滤
  const keys = conf.insertable.filter((k) => obj[k] !== undefined);
  if (!keys.length) return JsonFail(400, "没有可插入字段", 400);

  // 6) 生成 SQL
  const cols = keys.map((k) => `"${k}"`).join(", ");
  const placeholders = keys.map(() => "?").join(", ");
  const values = keys.map((k) => obj[k]);

  // 7) 选 DB
  let db: D1Database;
  try {
    db = getDB(env, project);
  } catch (e: any) {
    // getDB 里如果 throw {Code,Message}，这里转成 Response
    return JsonFail(e?.Code ?? 500, e?.Message ?? "数据库未配置", e?.Code ?? 500);
  }

  const sql = `INSERT INTO "${conf.table}" (${cols}) VALUES (${placeholders})`;

  // 8) 执行并返回
  try {
    const res = await db.prepare(sql).bind(...values).run();

    return JsonOk(
      {
        success: true,
        insertId: res.meta?.last_row_id ?? null,
        changes: res.meta?.changes ?? 0,
      },
      0
    );
  } catch (err: any) {
    const msg = String(err?.message || "");

    // 唯一约束
    if (msg.includes("UNIQUE") || msg.includes("constraint failed")) {
      return JsonFail(400, "卡密已存在，不能重复添加", 400);
    }

    return JsonFail(500, msg || "服务器内部错误", 500);
  }
}
