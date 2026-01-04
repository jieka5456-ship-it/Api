
import { JsonFail,JsonOk } from './Message'
import {TeamHome,AdminHome} from './Business'

export default {
  async fetch(req: Request, env: any) {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);

    
    return JsonOk({Name:parts}, 200);
  }
};
