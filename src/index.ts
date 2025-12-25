
import { JsonFail } from './Message'

export default {
  async fetch(req: Request, env: any) {
    // 解析请求体
    let body
    try {
      body = req.json()
    } catch (error) {
      return JsonFail(400, 'Invalid JSON format')
    }
    if (!body) return JsonFail(201, 'Parameters are missing')
    
    return JsonFail(200,'Request processed successfully');
  }
};
