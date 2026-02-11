//Grok业务函数
import { JsonOk,JsonFail } from "../Message";


//前端业务
export async function GrokSuperHome(req: Request, env: Env, parts: string[]){
    const action = parts[2];  // Create
    const Body = await req.json().catch(() => null);
    if(action === 'HomeSso' && req.method === 'POST') return await GrokSetSSO(env, Body);
    if(action === 'HomeGet' && req.method === 'POST') return await GrokGetSSO(env, Body);
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
    if(!isValidJWT(Body.Token))  return JsonFail(400,"参数异常")
    await env.TmSSO.put(Body.Type, Body.Token);
    return JsonOk({"msg":"正常的哈"},200)
}
//前端----查询SOO
async function GrokGetSSO(env:Env, Body:any) {
    if(!Body || typeof Body !== "object") return JsonFail(400,"参数异常")
    if(!Body.Type)  return JsonFail(400,"参数异常")
    const Keysso =  await env.TmSSO.get(Body.Type);
    return JsonOk({"Key":Keysso},200)
}



//JWT参数验证
function isValidJWT(token: string) {
  if (typeof token !== "string") return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const base64url = /^[A-Za-z0-9_-]+$/;
  return parts.every(p => base64url.test(p));
}