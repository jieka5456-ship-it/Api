import { JsonFail, JsonOk } from "./Message";
import { TeamHome, AdminHome } from "./Business";
import { TgPost } from "./Telegram";

const ALLOW_ORIGINS = ["http://localhost:5888"]; // 你的前端域名

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowOrigin = ALLOW_ORIGINS.includes(origin) ? origin : "";

  return {
    ...(allowOrigin ? { "Access-Control-Allow-Origin": allowOrigin } : {}),
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      req.headers.get("Access-Control-Request-Headers") ||
      "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function withCors(req: Request, res: Response) {
  const headers = new Headers(res.headers);
  const cors = getCorsHeaders(req);
  for (const [k, v] of Object.entries(cors)) if (v) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
}

export default {
  async fetch(req: Request, env: Env) {
    // ✅ 1) 预检
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: getCorsHeaders(req) });
    }

    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const project = parts[0];
    const module = parts[1];

    let res: Response;

    if (!project || !module) res = JsonFail(400, "缺少项目标识");
    else if (project === "a") {
      if (module === "Admin") res = await AdminHome(req, env, parts);
      else if (module === "Home") res = await TeamHome(req, env, parts);
      else res = JsonFail(404, "未知模块");
    } else if (project === "tg") {
      return TgPost(req,env)
    } else {
      res = JsonFail(404, "未知接口信息");
    }

    // ✅ 2) 所有响应统一加 CORS
    return withCors(req, res);
  },
};
