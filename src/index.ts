
import { JsonFail,JsonOk } from './Message'
import {TeamHome,AdminHome} from './Business'

export default {
  async fetch(req: Request, env: Env) {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const project = parts[0]; // a / b / c ...
    const module  = parts[1]; // Team / Admin
    if (!project || !module)  return JsonFail(400, "缺少项目标识");
    if (project==='a'){
      if(module==='Admin') return AdminHome(req,env,parts)
      if(module==='Home') return TeamHome(req,env,parts)
      return JsonFail(404, "未知模块", 404);
    }
    if (project==='b') {
      return JsonOk({Home:"项目b接口"},200)
    }
    return JsonFail(404, "未知接口信息", 404);
  }
};
