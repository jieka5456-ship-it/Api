// src/db/bulkCard.ts
import { getDB } from "./getDB";
import { SCHEMA_MAP } from "./SchemaMap";
import { JsonFail, JsonOk } from "../Message";

function isRecord(v: unknown): v is Record<string, any> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// 卡密生成：XXXX-XXXX-XXXX-XXXX（可读性更好：去掉 0O1I）
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
  const project = parts[0];    // a/b/c...
  const schemaKey = parts[3];  // 任意卡密表的 schemaKey（如 TeamCode / VipCode / RedeemCode ...）

  if (!project) return JsonFail(400, "缺少项目标识", 400);
  if (!schemaKey) return JsonFail(400, "缺少资源名（schemaKey）", 400);
  if (!isRecord(data)) return JsonFail(400, "请求体必须是 JSON 对象", 400);

  const CardInt = data.CardInt;
  const NumTime = data.NumTime;
  const UseState = data.UseState;
  const UseTime = data.UseTime ?? null;

  if (typeof CardInt !== "number" || !Number.isInteger(CardInt) || CardInt <= 0) {
    return JsonFail(400, "CardInt 必须是正整数", 400);
  }
  if (CardInt > 500) return JsonFail(400, "CardInt 过大，单次最多 500", 400);

  // NumTime/UseState 是否必须：看你的业务
  // 这里按你表结构：都需要
  if (typeof NumTime !== "number") return JsonFail(400, "NumTime 必须是数字", 400);
  if (typeof UseState !== "string" || !UseState) return JsonFail(400, "UseState 必须是字符串", 400);

  // 1) 取 schema
  const schemaGroup = (SCHEMA_MAP as any)[project];
  if (!schemaGroup) return JsonFail(400, `未知项目: ${project}`, 400);

  const conf = schemaGroup[schemaKey] as
    | { table: string; insertable: readonly string[]; required: readonly string[] }
    | undefined;

  if (!conf) return JsonFail(400, `未知资源: ${project}.${schemaKey}`, 400);

  // 2) 校验：该资源是否支持“生成卡密”
  // 你统一 Card 字段，那就以 Card 为准
  if (!conf.insertable.includes("Card")) {
    return JsonFail(400, `该资源不支持卡密字段 Card：${project}.${schemaKey}`, 400);
  }
  // 下面这些字段不一定每个项目都有，如果某项目没有 UseTime，就自动不插
  const wantCols = ["Card", "NumTime", "UseState", "UseTime"] as const;
  const cols = wantCols.filter((c) => conf.insertable.includes(c));
  // 但 NumTime/UseState 在你的表里是 NOT NULL，所以最好要求存在
  if (!cols.includes("NumTime") || !cols.includes("UseState")) {
    return JsonFail(400, `该资源缺少 NumTime/UseState 字段配置：${project}.${schemaKey}`, 400);
  }

  // 3) 选 DB
  let db: D1Database;
  try {
    db = getDB(env, project);
  } catch (e: any) {
    return JsonFail(e?.Code ?? 500, e?.Message ?? "数据库未配置", e?.Code ?? 500);
  }

  // 4) 批量生成 + INSERT OR IGNORE 补齐策略
  const batchSize = 100; // 每轮最多生成 100 条（避免参数过多）
  const maxRounds = 30;  // 最大轮数，避免极端情况下死循环

  let insertedTotal = 0;
  let rounds = 0;
  let collisionGuessed = 0; // 估算的“被忽略”条数（主要来自 UNIQUE 冲突）

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
        else if (c === "NumTime") binds.push(NumTime);
        else if (c === "UseState") binds.push(UseState);
        else if (c === "UseTime") binds.push(UseTime);
      }
    }

    const sql = `INSERT OR IGNORE INTO "${conf.table}" (${colsSql}) VALUES ${allRows}`;
    const res = await db.prepare(sql).bind(...binds).run();

    const inserted = res.meta?.changes ?? 0;
    insertedTotal += inserted;

    // 因为用了 OR IGNORE，被忽略的条数 ≈ 本轮生成数 - 本轮插入数
    collisionGuessed += (cards.length - inserted);
  }

  if (insertedTotal < CardInt) {
    return JsonFail(
      500,
      `生成未达到目标：目标 ${CardInt}，实际插入 ${insertedTotal}。可能库中卡密数量过多导致碰撞，请重试或降低数量。`,
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
      插入失败: CardInt - insertedTotal, // 理论上为 0（因为我们补齐了）
      忽略估计: collisionGuessed,        // 生成过程中由于 UNIQUE 被忽略的次数（估算值）
      失败原因: collisionGuessed > 0 ? "生成过程中出现重复/碰撞（UNIQUE）已自动重试补齐" : "无",
      轮次: rounds,
      提示: `已为 ${project}.${schemaKey} 生成并写入 ${insertedTotal} 条卡密`,
    },
    0
  );
}
