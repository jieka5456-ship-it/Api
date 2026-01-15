import { getDB } from "./getDB";
import { SCHEMA_MAP } from "./SchemaMap";
import { JsonFail, JsonOk } from "../Message";

function isRecord(v: unknown): v is Record<string, any> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

type WhereItem = { Field: string; Op?: string; Value: any };

type Conf = {
  table: string;
  primaryKey?: string;
  selectable: readonly string[];
  filterable: readonly string[];
  orderable: readonly string[];
};

const OP_MAP: Record<string, string> = {
  "=": "=",
  "!=": "!=",
  ">": ">",
  ">=": ">=",
  "<": "<",
  "<=": "<=",
  like: "LIKE",
};

export async function getList(env: Env, parts: string[], data: unknown): Promise<Response> {
  const project = parts[0];
  const schemaKey = parts[3];

  if (!project) return JsonFail(400, "缺少项目标识");
  if (!schemaKey) return JsonFail(400, "缺少资源名（schemaKey）");

  const body = isRecord(data) ? data : {};

  const schemaGroup = (SCHEMA_MAP as any)[project] as Record<string, Conf> | undefined;
  if (!schemaGroup) return JsonFail(400, `未知项目: ${project}`);

  const conf = schemaGroup[schemaKey];
  if (!conf) return JsonFail(400, `未知资源: ${project}.${schemaKey}`);

  let db: D1Database;
  try {
    db = getDB(env, project);
  } catch (e: any) {
    return JsonFail(e?.Code ?? 500, e?.Message ?? "数据库未配置");
  }

  // ---------- WHERE ----------
  const whereParts: string[] = [];
  const binds: any[] = [];

  const Where = Array.isArray(body.Where) ? (body.Where as WhereItem[]) : [];

  for (const w of Where) {
    if (!w || typeof w.Field !== "string") return JsonFail(400, "Where 条件格式错误");

    const field = w.Field;
    const opRaw = String(w.Op ?? "=").toLowerCase();
    const value = w.Value;

    const filterable = (conf.filterable ?? conf.selectable); // filterable 优先，没有就 fallback 到 selectable
    if (!filterable.includes(field)) return JsonFail(400, `不允许过滤字段: ${field}`);

    const sqlOp = OP_MAP[opRaw];
    if (!sqlOp) return JsonFail(400, `不支持操作符: ${w.Op}`);

    if (sqlOp === "LIKE") {
      whereParts.push(`"${field}" LIKE ?`);
      binds.push(`%${String(value ?? "")}%`);
    } else {
      whereParts.push(`"${field}" ${sqlOp} ?`);
      binds.push(value);
    }
  }

  const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

  // ---------- ORDER ----------
  const pk = conf.primaryKey ?? "ID";
  const orderBy = String(body.OrderBy ?? pk);
  const orderDir = String(body.Order ?? "desc").toLowerCase() === "asc" ? "ASC" : "DESC";

  const orderable = (conf.orderable ?? [conf.primaryKey ?? "ID"]);
  if (!orderable.includes(orderBy)) return JsonFail(400, `不允许排序字段: ${orderBy}`);

  // ---------- SELECT ----------
  const colsSql = conf.selectable.map((c) => `"${c}"`).join(", ");

  // ---------- PAGE (可选) ----------
  const hasPage = body.Page !== undefined || body.PageSize !== undefined;

  // ✅ 建议：不分页也限制最多返回 500 条，防止一次查爆
  const maxNoPage = 500;

  if (!hasPage) {
    const listSql = `
      SELECT ${colsSql}
      FROM "${conf.table}"
      ${whereSql}
      ORDER BY "${orderBy}" ${orderDir}
      LIMIT ?
    `;

    const rs = await db.prepare(listSql).bind(...binds, maxNoPage).all();

    return JsonOk(
      {
        list: rs.results ?? [],
        limited: true,
        limit: maxNoPage,
      },
      0
    );
  }

  const page = Number(body.Page ?? 1);
  const pageSize = Number(body.PageSize ?? 20);

  if (!Number.isInteger(page) || page <= 0) return JsonFail(400, "Page 必须是正整数");
  if (!Number.isInteger(pageSize) || pageSize <= 0 || pageSize > 200) return JsonFail(400, "PageSize 必须是 1~200");

  const offset = (page - 1) * pageSize;

  // total
  const totalRow = (await db
    .prepare(`SELECT COUNT(1) as cnt FROM "${conf.table}" ${whereSql}`)
    .bind(...binds)
    .first()) as any;

  const total = Number(totalRow?.cnt ?? 0);

  const listSql = `
    SELECT ${colsSql}
    FROM "${conf.table}"
    ${whereSql}
    ORDER BY "${orderBy}" ${orderDir}
    LIMIT ? OFFSET ?
  `;

  const rs = await db.prepare(listSql).bind(...binds, pageSize, offset).all();

  return JsonOk(
    {
      page,
      pageSize,
      total,
      list: rs.results ?? [],
    },
    0
  );
}
