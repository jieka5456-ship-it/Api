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
  // 你也可以改成判断 conf.table === "TeamCode"
  if (!("Card" in data) || !Array.isArray(data.Card)) {
    return JsonFail(400, "缺少 Card 数组", 400);
  }

  const cardsRaw = data.Card as unknown[];
  const NumTime = data.NumTime;
  const UseState = data.UseState;
  const UseTime = (data as any).UseTime;

  if (typeof NumTime !== "number") return JsonFail(400, "NumTime 必须是数字", 400);
  if (typeof UseState !== "string" || !UseState) return JsonFail(400, "UseState 必须是字符串", 400);

  // 3) 清洗卡密：去空、去重（可选：不去重也行，但会导致更多 UNIQUE 冲突）
  const normalized: string[] = [];
  for (const c of cardsRaw) {
    if (typeof c !== "string") continue;
    const v = c.trim();
    if (!v) continue;
    normalized.push(v);
  }
  if (!normalized.length) return JsonFail(400, "Card 数组不能为空", 400);

  // 去重（建议开启）
  const uniqueCards = Array.from(new Set(normalized));

  // 4) 选 DB
  let db: D1Database;
  try {
    db = getDB(env, project);
  } catch (e: any) {
    return JsonFail(e?.Code ?? 500, e?.Message ?? "数据库未配置", e?.Code ?? 500);
  }

  // 5) 生成批量 INSERT（一次插多行）
  // 注意：只插 insertable 白名单字段，并且本接口固定每条都包含 Card/NumTime/UseState/(UseTime可选)
  const insertCols = conf.insertable.filter((c) =>
    c === "Card" || c === "NumTime" || c === "UseState" || c === "UseTime"
  );

  // 必须至少包含 Card/NumTime/UseState
  if (!insertCols.includes("Card") || !insertCols.includes("NumTime") || !insertCols.includes("UseState")) {
    return JsonFail(400, "该资源不支持批量卡密导入", 400);
  }

  // 组装 values
  const rows: any[] = [];
  const placeholdersPerRow = `(${insertCols.map(() => "?").join(", ")})`;
  const placeholdersAll = uniqueCards.map(() => placeholdersPerRow).join(", ");

  for (const card of uniqueCards) {
    for (const col of insertCols) {
      if (col === "Card") rows.push(card);
      else if (col === "NumTime") rows.push(NumTime);
      else if (col === "UseState") rows.push(UseState);
      else if (col === "UseTime") rows.push(UseTime ?? null);
    }
  }

  const colsSql = insertCols.map((c) => `"${c}"`).join(", ");
  // SQLite 支持：INSERT OR IGNORE（遇到 UNIQUE 冲突自动跳过）
  const sql = `INSERT OR IGNORE INTO "${conf.table}" (${colsSql}) VALUES ${placeholdersAll}`;

  try {
    const res = await db.prepare(sql).bind(...rows).run();

    // changes = 实际插入的条数（被 ignore 的不算）
    const inserted = res.meta?.changes ?? 0;
    const requested = uniqueCards.length;
    const skipped = requested - inserted;

    return JsonOk(
      {
        success: true,
        table: conf.table,
        requested,
        inserted,
        skipped,
        // 这里也可以把“重复被跳过的卡密”返回，但需要额外查重；先不做，避免慢
      },
      0
    );
  } catch (err: any) {
    const msg = String(err?.message || "");
    return JsonFail(500, msg || "服务器内部错误", 500);
  }
}
