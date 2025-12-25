export default {
  async fetch(req: Request) {
    const url = new URL(req.url);

    // 健康检查
    if (req.method === "GET" && url.pathname === "/api/health") {
      return new Response(
        JSON.stringify({ ok: true, msg: "worker alive" }),
        { headers: { "content-type": "application/json; charset=utf-8" } }
      );
    }

    return new Response("Not Found", { status: 404 });
  },
};
