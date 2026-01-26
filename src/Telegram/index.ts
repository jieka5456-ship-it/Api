
import { JsonOk } from "../Message";
const BOT_TOKEN = "8257891631:AAGbEYI-YzuhpvUpcM8KsbxsJcVeit79Ymo"
export async function TgPost(Req: any, Env: any) {
  const update: any = await Req.json().catch(() => null);
  console.log("TG_UPDATE:", JSON.stringify(update));

  const chatId = update?.message?.chat?.id;
  const text = update?.message?.text ?? "";
  console.log("chatId =", chatId, "text =", text);

  if (!chatId) {
    console.log("No chatId. Maybe callback_query or other update type.");
    return JsonOk({ ok: true, reason: "no chatId" }, 200);
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const payload = { chat_id: chatId, text: `收到：${text || "(非文本消息)"}` };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await resp.json().catch(() => ({}));
  console.log("sendMessage status:", resp.status, "resp:", JSON.stringify(data));

  return JsonOk({ ok: true, tg: data }, 200);
}
