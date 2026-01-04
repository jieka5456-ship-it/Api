//前端业务处理逻辑
import { JsonFail } from '../Message'

//查询卡密是否存在/使用
export async function GetCard(req: Request, env: any) {
    const Body = await req.json();
   

  return JsonFail(200,"这是前端业务处理区域");
}

//查询卡密/邮箱是否匹配
export async function GetCardEmail(req: Request, env: any) {
    const Body = await req.json();
    

  return JsonFail(200,"这是前端业务处理区域");
}

//创建团队订单
export async function AddTeamOrder(req: Request, env: any) {
    const Body = await req.json();
    

  return JsonFail(200,"这是前端业务处理区域");
}

//发送团队邀请
export async function BusinessTeam(req: Request, env: any) {
    const Body = await req.json();
    

  return JsonFail(200,"这是前端业务处理区域");
}

//修改团队邮箱
export async function SetEmail(req: Request, env: any) {
    const Body = await req.json();
    

  return JsonFail(200,"这是前端业务处理区域");
}

//检测团队状态
export async function GetBusiness(req: Request, env: any) {
    const Body = await req.json();
    

  return JsonFail(200,"这是前端业务处理区域");
}
