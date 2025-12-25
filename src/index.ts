
export default {
  async fetch(req: Request, env: any) {
    const path = new URL(req.url).pathname;
    if(path === '/api/test')
    return path

  },
};
