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
  const action = parts[2];  // Create
  const body = await req.json().catch(() => null);
  if(action === 'Create' && req.method === 'POST'){
    return await insertOne(env, parts, body);
  }
  
}

