
import { JsonFail } from './Message'
import {handleTeam} from './Routes/team'

export default {
  async fetch(req: Request, env: any) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/team')) return handleTeam(req,env);
    return new Response('222', { status: 404 });
  }
};
