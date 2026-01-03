
import { JsonFail } from './Message'
import {TeamHome,AdminHome} from './Business'

export default {
  async fetch(req: Request, env: any) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/Team')) return TeamHome(req,env);
    if (url.pathname.startsWith('/Admin')) return AdminHome(req,env);
    return new Response('222', { status: 404 });
  }
};
