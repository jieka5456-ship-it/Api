//Grok业务函数
import { JsonOk,JsonFail } from "../Message";


//前端业务
export async function GrokSuperHome(req: Request, env: Env, parts: string[]){
    const action = parts[2];  // Create
    const Body = await req.json().catch(() => null);
    if(action === 'HomeSso' && req.method === 'POST') return await GrokSetSSO(env, Body);
    return JsonOk({"msg":"没找到项目哈"},200)
}



//后端业务
export async function GrokSuperAdmin(req: Request, env: Env, parts: string[]){
    const action = parts[2];  // Create
    const Body = await req.json().catch(() => null);
    return JsonOk({"msg":"来到了后端项目哈"},200)
}


//前端----添加SOO
async function GrokSetSSO(env:Env, Body:any) {
    if(!Body || typeof Body !== "object") return JsonFail(400,"参数异常")
    if(!isValidJWT(Body.sso))  return JsonFail(400,"参数异常")
    await env.TmSSO.put("GROK_SSO", Body.sso);
    return JsonOk({"msg":"正常的哈"},200)
}




//JWT参数验证
function isValidJWT(token: string) {
  if (typeof token !== "string") return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const base64url = /^[A-Za-z0-9_-]+$/;
  return parts.every(p => base64url.test(p));
}