//team.ts
//团队项目Api
import { JsonFail,JsonOk } from '../Message'
export async function TeamHome(req: Request, env: Env) {
    const Body = await req.json().catch(() => null);
    //前端业务处理
    const db = env.business;
    const row = await db.prepare("SELECT 1 as ok").first();
    

  return JsonOk({
    message: "这是后端业务处理区域",
    db_ok: row?.ok === 1,
    Body
  },200);
}










export async function AdminHome(req: Request, env: Env) {
    const Body = await req.json().catch(() => null);
    //后台业务逻辑
    

  return JsonFail(200,"这是后端业务处理区域");
}