//DB选择器
const DB_MAP = {
    a:"business",
    b:"DB1",
    c:"DB2",
    d:"DB3",
    e:"DB4"
} as const;

type ProjectKey = keyof typeof DB_MAP;

export function getDB(env: Env, project: string): D1Database {
  const envKey = DB_MAP[project as ProjectKey];
  if (!envKey) {
    throw { Code: 400, Message: `未知的业务标识: ${project}` };
  }
  const db = env[envKey];
  if (!db) {
    throw { Code: 500, Message: `数据库未配置: ${envKey}` };
  }

  return db;
}