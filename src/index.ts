
import {Fail} from './Message'

export default {
  async fetch(req: Request, env: any) {
    // 解析请求体
    const body = await req.json().catch(() => null);
    
    return Fail(201,'路径错误')
    
  }
};
