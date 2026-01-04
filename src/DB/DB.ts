//通用数据库增删改查


//D1通用添加方法

export async function insertOne(
  db: D1Database,
  table: string,
  insertable: readonly string[],
  data: Record<string, any>
) {
  const keys = insertable.filter((k) => data[k] !== undefined);
  if (keys.length === 0) {
    throw { Code: 400, Message: "没有可插入字段" };
  }

  const cols = keys.map((k) => `"${k}"`).join(", ");
  const placeholders = keys.map(() => "?").join(", ");
  const values = keys.map((k) => data[k]);

  const sql = `INSERT INTO "${table}" (${cols}) VALUES (${placeholders})`;
  const res = await db.prepare(sql).bind(...values).run();
  return res;
}