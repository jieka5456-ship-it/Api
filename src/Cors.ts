// cors.ts
const ALLOW_ORIGINS = [
  "http://localhost:5888",
  "http://localhost:5173",
  "http://localhost:3000",
  "https://teamgo.pages.dev",
  "https://plusapi.jieka5456.workers.dev"
];

export function getCorsHeaders(req: Request) {
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

export function withCors(req: Request, res: Response) {
  const headers = new Headers(res.headers);
  const cors = getCorsHeaders(req);

  for (const [k, v] of Object.entries(cors)) {
    if (v) headers.set(k, v);
  }

  return new Response(res.body, {
    status: res.status,
    headers,
  });
}
