// src/db/bulkCard.ts
import { getDB } from "./getDB";
import { SCHEMA_MAP } from "./SchemaMap";
import { JsonFail, JsonOk } from "../Message";

function isRecord(v: unknown): v is Record<string, any> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export async function bulkCard(env: Env, parts: string[], data: unknown): Promise<Response> {
  const project = parts[0];     // a
  const schemaKey = parts[3];   // TeamCode

  if (!project) return JsonFail(400, "缺少项目标识", 400);
  if (!schemaKey) return JsonFail(400, "缺少资源名（schemaKey）", 400);
  if (!isRecord(data)) return JsonFail(400, "请求体必须是 JSON 对象", 400);

  // 1) 找 schema
  const schemaGroup = (SCHEMA_MAP as any)[project];
  if (!schemaGroup) return JsonFail(400, `未知项目: ${project}`, 400);

  const conf = schemaGroup[schemaKey] as
    | { table: string; insertable: readonly string[]; required: readonly string[] }
    | undefined;

  if (!conf) return JsonFail(400, `未知资源: ${project}.${schemaKey}`, 400);

  // 2) 只允许用于“卡密表”的批量（防止误用）
  if (!("Card" in data) || !Array.isArray(data.Card)) {
    return JsonFail(400, "缺少 Card 数组", 400);
  }

  const cardsRaw = data.Card as unknown[];
  const NumTime = data.NumTime;
  const UseState = data.UseState;
  const UseTime = (data as any).UseTime;

  if (typeof NumTime !== "number") return JsonFail(400, "NumTime 必须是数字", 400);
  if (typeof UseState !== "string" || !UseState) return JsonFail(400, "UseState 必须是字符串", 400);

  // 3) 清洗卡密：去空、去重
  const normalized: string[] = [];
  const duplicates: string[] = [];
  for (const c of cardsRaw) {
    if (typeof c !== "string") continue;
    const v = c.trim();
    if (!v) continue;

    // 检查是否已经出现过（去重）
    if (normalized.includes(v)) {
      duplicates.push(v);
    } else {
      normalized.push(v);
    }
  }
  if (!normalized.length) return JsonFail(400, "Card 数组不能为空", 400);

  // 4) 选 DB
  let db: D1Database;
  try {
    db = getDB(env, project);
  } catch (e: any) {
    return JsonFail(e?.Code ?? 500, e?.Message ?? "数据库未配置", e?.Code ?? 500);
  }

  // 5) 生成批量 INSERT（一次插多行）
  const insertCols = conf.insertable.filter((c) =>
    c === "Card" || c === "NumTime" || c === "UseState" || c === "UseTime"
  );

  if (!insertCols.includes("Card") || !insertCols.includes("NumTime") || !insertCols.includes("UseState")) {
    return JsonFail(400, "该资源不支持批量卡密导入", 400);
  }

  const rows: any[] = [];
  const placeholdersPerRow = `(${insertCols.map(() => "?").join(", ")})`;
  const placeholdersAll = normalized.map(() => placeholdersPerRow).join(", ");

  for (const card of normalized) {
    for (const col of insertCols) {
      if (col === "Card") rows.push(card);
      else if (col === "NumTime") rows.push(NumTime);
      else if (col === "UseState") rows.push(UseState);
      else if (col === "UseTime") rows.push(UseTime ?? null);
    }
  }

  const colsSql = insertCols.map((c) => `"${c}"`).join(", ");
  const sql = `INSERT OR IGNORE INTO "${conf.table}" (${colsSql}) VALUES ${placeholdersAll}`;

  try {
    const res = await db.prepare(sql).bind(...rows).run();

    // changes = 实际插入的条数（被 ignore 的不算）
    const inserted = res.meta?.changes ?? 0;
    const requested = normalized.length;
    const skipped = requested - inserted;

    // 返回中文格式的成功/失败统计
    const message = {
      success: true,
      table: conf.table,
      requested,
      inserted,
      skipped,
      skippedRecords: duplicates,
      message: `成功插入 ${inserted} 条卡密，跳过了 ${skipped} 条（已存在或重复）。`,
    };

    return JsonOk(message, 0);
  } catch (err: any) {
    const msg = String(err?.message || "");
    return JsonFail(500, msg || "服务器内部错误", 500);
  }
}
