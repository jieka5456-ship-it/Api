
import { JsonOk } from "../Message";

const BOT_TOKEN = "8257891631:AAGbEYI-YzuhpvUpcM8KsbxsJcVeit79Ymo"
export async function TgPost(Req:any,Env:any) {
    const update: any = await Req.json();
    const chatId = update?.message?.chat?.id;
    const text = update?.message?.text ?? "";
    if(chatId){
        await fetch(`https://api.telegram.org/bot${Env.BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            chat_id: chatId,
            text: `收到：${text || "(非文本消息)"}`,
            }),
        });
    }
    return JsonOk({ ok: true }, 200);
}