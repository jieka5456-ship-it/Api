
import { JsonFail } from './Message'

export default {
  async fetch(req: Request, env: any) {
    // 解析请求体
    const body = req.json()
    
    return JsonFail(200,'33333');
  }
};
