export default {
  async fetch(req: Request, env: any) {
    // 只处理 GET 请求
    if (req.method === "GET") {
      return new Response(
        JSON.stringify({
          code: 888,
          message: "test ok",
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json; charset=utf-8",
          },
        }
      );
    }

    // 其他请求兜底
    return new Response(
      JSON.stringify({
        code: 405,
        message: "Method Not Allowed",
      }),
      {
        status: 405,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      }
    );
  },
};
