
import { JsonOk } from "../Message";

const BOT_TOKEN = "8257891631:AAGbEYI-YzuhpvUpcM8KsbxsJcVeit79Ymo"
export async function TgPost(Req:any,Env:any) {
    
    const update = await Req.json().catch(() => null);
    console.log("TG_UPDATE_RAW:", JSON.stringify(update));

    return JsonOk(update, 200)
}