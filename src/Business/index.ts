//team.ts
//前端调用的接口
import { JsonFail, JsonOk } from '../Message'
import { insertOne } from '../DB' // 路径按你项目实际调整




export async function TeamHome(req: Request, env: Env, project: string[]) {
  const Body = await req.json().catch(() => null);
  //前端业务处理
  const db = env.business;
  const row = await db.prepare("SELECT 1 as ok").first();


  return JsonOk({
    message: "这是后端业务处理区域",
    db_ok: row?.ok === 1,
    Body
  }, 200);
}


//后端调用的接口
export async function AdminHome(req: Request, env: Env, parts: string[]) {
  const project = parts[0];  // a
  const action = parts[2];  // Create
  const schemaKey = parts[3];  // PlucCode
  try {
    if (action === 'Create' && req.method === 'POST') {
      if (!schemaKey) return JsonFail(400, "缺少资源参数信息");
      const body = await req.json().catch(() => null);
      if (!body || typeof body !== 'object') return JsonFail(400, "请求体必须是 JSON 对象");
      //使用通用添加功能
      const res = await insertOne(env, project, schemaKey, body);
      return JsonOk({ success: true, insertId: res.meta?.last_row_id ?? null, changes: res.meta?.changes ?? 0 }, 0);
    }
    return JsonFail(404, "不支持的操作", 404);
  } catch (err: any) {
    const msg = String(err?.message || err?.Message || "");

    // ✅ 识别 SQLite/D1 唯一约束错误
    if (msg.includes("UNIQUE") || msg.includes("constraint failed")) {
      return JsonFail(400, "卡密已存在，不能重复添加", 400);
    }

    // ✅ 你自己 throw 的格式（{Code, Message}）
    if (err?.Code && err?.Message) {
      return JsonFail(err.Code, err.Message, err.Code);
    }

    // ✅ 其他未知错误
    return JsonFail(500, msg || "服务器内部错误", 500);
  }
}