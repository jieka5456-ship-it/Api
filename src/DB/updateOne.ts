import { getDB } from "./getDB";
import { SCHEMA_MAP } from "./SchemaMap";
import { JsonFail, JsonOk } from "../Message";

function isRecord(v: unknown): v is Record<string, any> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

type Conf = {
  table: string;
  primaryKey?: string;
  updatable?: readonly string[];
};

export async function updateOne(env: Env, parts: string[], data: unknown): Promise<Response> {
  const project = parts[0];     // a
  const schemaKey = parts[3];   // Code / TeamOrder / TeamMgmt

  if (!project) return JsonFail(400, "缺少项目标识");
  if (!schemaKey) return JsonFail(400, "缺少资源名（schemaKey）");
  if (!isRecord(data)) return JsonFail(400, "请求体必须是 JSON 对象");

  const ID = data.ID;
  const Data = data.Data;

  if (typeof ID !== "number" || !Number.isInteger(ID) || ID <= 0) {
    return JsonFail(400, "ID 必须是正整数");
  }
  if (!isRecord(Data)) {
    return JsonFail(400, "Data 必须是 JSON 对象");
  }

  // 取 schema
  const schemaGroup = (SCHEMA_MAP as any)[project] as Record<string, Conf> | undefined;
  if (!schemaGroup) return JsonFail(400, `未知项目: ${project}`);

  const conf = schemaGroup[schemaKey] as Conf | undefined;
  if (!conf) return JsonFail(400, `未知资源: ${project}.${schemaKey}`);

  const pk = conf.primaryKey ?? "ID";
  const updatable = conf.updatable ?? [];

  if (!Array.isArray(updatable) || updatable.length === 0) {
    return JsonFail(400, `该资源不允许修改: ${project}.${schemaKey}`);
  }

  // 白名单过滤
  const keys = updatable.filter((k) => Data[k] !== undefined);
  if (keys.length === 0) return JsonFail(400, "没有可更新字段");

  const setSql = keys.map((k) => `"${k}" = ?`).join(", ");
  const values = keys.map((k) => Data[k]);

  // 选 DB
  let db: D1Database;
  try {
    db = getDB(env, project);
  } catch (e: any) {
    return JsonFail(e?.Code ?? 500, e?.Message ?? "数据库未配置");
  }

  const sql = `UPDATE "${conf.table}" SET ${setSql} WHERE "${pk}" = ?`;

  try {
    const res = await db.prepare(sql).bind(...values, ID).run();

    return JsonOk(
      {
        success: true,
        changes: res.meta?.changes ?? 0,
      },
      200
    );
  } catch (err: any) {
    return JsonFail(500, String(err?.message || "服务器内部错误"));
  }
}
