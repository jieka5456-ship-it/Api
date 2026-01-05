import { getDB } from "./getDB";
import { SCHEMA_MAP } from "./SchemaMap";

export async function insertOne(
  env: Env,
  project: string,
  schemaKey: string,
  data: Record<string, any>
) {
  const schemaGroup = (SCHEMA_MAP as any)[project];
  if (!schemaGroup) {
    throw { Code: 400, Message: `未知项目: ${project}` };
  }

  const conf = schemaGroup[schemaKey] as
    | {
        table: string;
        insertable: readonly string[];
        required: readonly string[];
      }
    | undefined;

  if (!conf) {
    throw { Code: 400, Message: `未知资源: ${schemaKey}` };
  }

  // 必填校验
  const missing = conf.required.filter(
    (k) => data[k] === undefined || data[k] === null
  );
  if (missing.length) {
    throw { Code: 400, Message: `缺少必填字段: ${missing.join(", ")}` };
  }

  // 白名单字段
  const keys = conf.insertable.filter((k) => data[k] !== undefined);
  if (!keys.length) {
    throw { Code: 400, Message: "没有可插入字段" };
  }

  const cols = keys.map((k) => `"${k}"`).join(", ");
  const placeholders = keys.map(() => "?").join(", ");
  const values = keys.map((k) => data[k]);

  const db = getDB(env, project);
  const sql = `INSERT INTO "${conf.table}" (${cols}) VALUES (${placeholders})`;

  return db.prepare(sql).bind(...values).run();
}
