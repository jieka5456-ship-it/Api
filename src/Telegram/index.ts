
import { JsonOk } from "../Message";


export async function TgPost(req: Request, env: Env) {
    
    return JsonOk({ Home: "Tg测试成功" }, 200)
}