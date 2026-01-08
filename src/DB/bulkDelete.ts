import { getDB } from "./getDB";
import { SCHEMA_MAP } from "./SchemaMap";
import { JsonFail, JsonOk } from "../Message";

function isRecord(v: unknown): v is Record<string, any> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export async function bulkDelete(
  env: Env,
  parts: string[],
  data: unknown
): Promise<Response> {

  const project   = parts[0]; // a
  const schemaKey = parts[3]; // TeamCode / TeamOrder / TeamMgmt

  if (!project)   return JsonFail(400, "缺少项目标识", 400);
  if (!schemaKey) return JsonFail(400, "缺少资源名（schemaKey）", 400);
  if (!isRecord(data)) return JsonFail(400, "请求体必须是 JSON 对象", 400);

  const ids = data.ID;

  // 1️⃣ ID 校验
  if (!Array.isArray(ids) || ids.length === 0) {
    return JsonFail(400, "ID 必须是非空数组", 400);
  }

  // 只保留合法数字 ID
  const cleanIds = ids.filter(
    (v) => typeof v === "number" && Number.isInteger(v) && v > 0
  );

  if (cleanIds.length === 0) {
    return JsonFail(400, "ID 数组中没有有效的数字 ID", 400);
  }

  // 2️⃣ 找 schema
  const schemaGroup = (SCHEMA_MAP as any)[project];
  if (!schemaGroup) return JsonFail(400, `未知项目: ${project}`, 400);

  const conf = schemaGroup[schemaKey] as
    | { table: string; primaryKey?: string }
    | undefined;

  if (!conf) return JsonFail(400, `未知资源: ${project}.${schemaKey}`, 400);

  const pk = conf.primaryKey ?? "ID"; // 默认 ID

  // 3️⃣ 选数据库
  let db: D1Database;
  try {
    db = getDB(env, project);
  } catch (e: any) {
    return JsonFail(e?.Code ?? 500, e?.Message ?? "数据库未配置", e?.Code ?? 500);
  }

  // 4️⃣ 单条删除（最稳）
  const sql = `DELETE FROM "${conf.table}" WHERE "${pk}" = ?`;
  const stmt = db.prepare(sql);

  let deleted = 0;

  for (const id of cleanIds) {
    const res = await stmt.bind(id).run();
    if ((res.meta?.changes ?? 0) > 0) {
      deleted++;
    }
  }

  // 5️⃣ 返回
  return JsonOk(
    {
      requested: ids.length,
      deleted: deleted
    },
    200
  );
}
