
import { JsonOk } from "../Message";


export async function TgPost() {
    
    return JsonOk({ Home: "Tg测试成功" }, 200)
}