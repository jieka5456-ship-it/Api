
import { JsonFail } from './Message'

export default {
  async fetch(req: Request, env: any) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/team')) return new Response('Not 111', { status: 404 });
    return new Response('222', { status: 404 });
  }
};
