//team.ts
//团队项目Api
import { JsonFail } from '../Message'
export async function TeamHome(req: Request, env: any) {
    const Body = await req.json();
    //前端业务处理


  return JsonFail(200,"这是前端业务处理区域");
}










export async function AdminHome(req: Request, env: any) {
    const Body = await req.json();
    //后台业务逻辑
    

  return JsonFail(200,"这是后端业务处理区域");
}