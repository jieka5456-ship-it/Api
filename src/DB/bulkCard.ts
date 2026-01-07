// src/db/bulkCard.ts
import { getDB } from "./getDB";
import { SCHEMA_MAP } from "./SchemaMap";
import { JsonFail, JsonOk } from "../Message";

function isRecord(v: unknown): v is Record<string, any> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

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

export async function bulkCard(env: Env, parts: string[], data: unknown): Promise<Response> {
  const project = parts[0];
  const schemaKey = parts[3];

  if (!project) return JsonFail(400, "缺少项目标识", 400);
  if (!schemaKey) return JsonFail(400, "缺少资源名（schemaKey）", 400);
  if (!isRecord(data)) return JsonFail(400, "请求体必须是 JSON 对象", 400);

  // 1) CardInt 必传
  const CardInt = data.CardInt;
  if (typeof CardInt !== "number" || !Number.isInteger(CardInt) || CardInt <= 0) {
    return JsonFail(400, "CardInt 必须是正整数", 400);
  }
  if (CardInt > 500) return JsonFail(400, "CardInt 过大，单次最多 500", 400);

  // 2) schema
  const schemaGroup = (SCHEMA_MAP as any)[project];
  if (!schemaGroup) return JsonFail(400, `未知项目: ${project}`, 400);

  const conf = schemaGroup[schemaKey] as
    | { table: string; insertable: readonly string[]; required: readonly string[] }
    | undefined;

  if (!conf) return JsonFail(400, `未知资源: ${project}.${schemaKey}`, 400);

  // 3) 必须支持 Card 字段（你统一了 Card）
  if (!conf.insertable.includes("Card")) {
    return JsonFail(400, `该资源不支持 Card 字段: ${project}.${schemaKey}`, 400);
  }

  // 4) 可选字段策略：只要 body 传了，且在 insertable 白名单里，就插入
  //    固定插 Card，其它字段从 body 自动拾取
  const obj = data as Record<string, any>;

  // required 字段里除了 Card 以外，如果你没传就报错（避免 NOT NULL 失败）
  const requiredMissing = conf.required.filter((k) => k !== "Card" && (obj[k] === undefined || obj[k] === null));
  if (requiredMissing.length) {
    return JsonFail(400, `缺少必填字段: ${requiredMissing.join(", ")}`, 400);
  }

  // 要插入的列：Card +（body 里有值的 insertable 字段）
  const extraCols = conf.insertable.filter((k) => k !== "Card" && obj[k] !== undefined);
  const cols = ["Card", ...extraCols];

  // 5) 选 DB
  let db: D1Database;
  try {
    db = getDB(env, project);
  } catch (e: any) {
    return JsonFail(e?.Code ?? 500, e?.Message ?? "数据库未配置", e?.Code ?? 500);
  }

  // 6) 分批插入（避免参数过多）
  const batchSize = 100;
  const maxRounds = 30;
  let insertedTotal = 0;
  let rounds = 0;
  let ignoredGuessed = 0;

  while (insertedTotal < CardInt && rounds < maxRounds) {
    rounds++;
    const need = CardInt - insertedTotal;
    const genCount = Math.min(batchSize, need);

    // 本轮生成并去重
    const set = new Set<string>();
    while (set.size < genCount) set.add(genCard());
    const cards = Array.from(set);

    const colsSql = cols.map((c) => `"${c}"`).join(", ");
    const perRow = `(${cols.map(() => "?").join(", ")})`;
    const allRows = cards.map(() => perRow).join(", ");

    const binds: any[] = [];
    for (const card of cards) {
      for (const c of cols) {
        if (c === "Card") binds.push(card);
        else binds.push(obj[c]); // 其他字段：前端传了什么就写什么
      }
    }

    const sql = `INSERT OR IGNORE INTO "${conf.table}" (${colsSql}) VALUES ${allRows}`;
    const res = await db.prepare(sql).bind(...binds).run();

    const inserted = res.meta?.changes ?? 0;
    insertedTotal += inserted;
    ignoredGuessed += (cards.length - inserted);
  }

  if (insertedTotal < CardInt) {
    return JsonFail(
      500,
      `生成未达到目标：目标 ${CardInt}，实际插入 ${insertedTotal}。可能卡密碰撞较多，请重试或降低数量。`,
      500
    );
  }

  return JsonOk(
    {
      成功: true,
      项目: project,
      资源: schemaKey,
      表名: conf.table,
      目标生成: CardInt,
      插入成功: insertedTotal,
      忽略估计: ignoredGuessed,
      说明: ignoredGuessed > 0 ? "生成过程中发生 UNIQUE 碰撞，已自动忽略并补齐" : "无碰撞",
      插入字段: cols, // 让你看清楚本次实际写入了哪些列
    },
    0
  );
}
