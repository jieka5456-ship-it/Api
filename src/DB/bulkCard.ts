// src/db/bulkCard.ts
import { getDB } from "./getDB";
import { SCHEMA_MAP } from "./SchemaMap";
import { JsonFail, JsonOk } from "../Message";

function isRecord(v: unknown): v is Record<string, any> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// 生成卡密：XXXX-XXXX-XXXX-XXXX（排除 0O1I）
function genCard(seg = 4, segCount = 4): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < segCount; i++) {
    let s = "";
    for (let j = 0; j < seg; j++) s += chars[Math.floor(Math.random() * chars.length)];
    out += (i === 0 ? "" : "-") + s;
  }
  return out;
}

type TableConf = {
  table: string;
  insertable: readonly string[];
  required: readonly string[];
};

export async function bulkCard(env: Env, parts: string[], data: unknown): Promise<Response> {
  const project = parts[0];
  const schemaKey = parts[3];

  if (!project) return JsonFail(400, "缺少项目标识", 400);
  if (!schemaKey) return JsonFail(400, "缺少资源名（schemaKey）", 400);
  if (!isRecord(data)) return JsonFail(400, "请求体必须是 JSON 对象", 400);

  const CardInt = data.CardInt;
  if (typeof CardInt !== "number" || !Number.isInteger(CardInt) || CardInt <= 0) {
    return JsonFail(400, "CardInt 必须是正整数", 400);
  }
  if (CardInt > 500) return JsonFail(400, "CardInt 过大，单次最多 500", 400);

  const schemaGroup = (SCHEMA_MAP as any)[project] as Record<string, TableConf> | undefined;
  if (!schemaGroup) return JsonFail(400, `未知项目: ${project}`, 400);

  const conf = schemaGroup[schemaKey];
  if (!conf) return JsonFail(400, `未知资源: ${project}.${schemaKey}`, 400);

  if (!conf.insertable.includes("Card")) {
    return JsonFail(400, `该资源未配置 Card 字段: ${project}.${schemaKey}`, 400);
  }

  // 关键：只插入前端“传了”的字段（且在 insertable 白名单内）
  // 固定插入 Card，其它按需
  const payload = data; // Record<string, any>
  const extraCols = conf.insertable.filter((k) => k !== "Card" && payload[k] !== undefined);
  const cols = ["Card", ...extraCols];

  // 如果 schema.required 里（除 Card 外）有必填字段，但前端没传，就直接报错
  // 否则你会一直插入失败导致死循环/超时
  const missing = conf.required.filter((k) => k !== "Card" && payload[k] === undefined);
  if (missing.length) {
    return JsonFail(400, `缺少必填字段: ${missing.join(", ")}`, 400);
  }

  let db: D1Database;
  try {
    db = getDB(env, project);
  } catch (e: any) {
    return JsonFail(e?.Code ?? 500, e?.Message ?? "数据库未配置", e?.Code ?? 500);
  }

  // 单条插入：避免 SQL variables 上限问题
  const colsSql = cols.map((c) => `"${c}"`).join(", ");
  const placeholders = cols.map(() => "?").join(", ");
  const sql = `INSERT OR IGNORE INTO "${conf.table}" (${colsSql}) VALUES (${placeholders})`;

  let inserted = 0;
  const cards: string[] = [];

  // 防止死循环：最多尝试 N 次（默认是目标数量的 20 倍，且至少 200）
  const maxAttempts = Math.max(200, CardInt * 20);
  let attempts = 0;

  while (inserted < CardInt && attempts < maxAttempts) {
    attempts++;

    const card = genCard();
    const values = cols.map((c) => (c === "Card" ? card : payload[c]));

    const res = await db.prepare(sql).bind(...values).run();
    // OR IGNORE：如果重复/冲突 changes=0，不算插入成功，继续生成下一条
    if ((res.meta?.changes ?? 0) > 0) {
        inserted++;
        cards.push(card); // ← 只记录成功插入的
}
  }
  // 你说只要成功数量，那就只返回成功数量
  return JsonOk(
    {
      CardNum: inserted,
      CardTxt:cards
    },
    200
  );
}
