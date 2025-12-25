export default {
  async fetch(req: Request, env: any) {
    const path = new URL(req.url).pathname;

    if (path === "/api/test") {
      return new Response(path, {
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};
