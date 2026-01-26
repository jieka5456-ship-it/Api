
import { JsonOk } from "../Message";
const BOT_TOKEN = "8257891631:AAGbEYI-YzuhpvUpcM8KsbxsJcVeit79Ymo"
export async function TgPost(Req: any, Env: any) {
    const update: any = await Req.json().catch(() => null);
    console.log("TG_UPDATE:", JSON.stringify(update));

    const chatId = update?.message?.chat?.id;
    const text = update?.message?.text ?? "";

    //先判断用户ID是否存在
    if (!chatId) {
        console.log("No chatId. Maybe callback_query or other update type.");
        return JsonOk({ ok: true, reason: "no chatId" }, 200);
    }

    // 判断文本是否存在
    let json: any = null;
    try {
        json = JSON.parse(text);
    } catch (e) {
        json = null;
    }
    if (!json) {
        return return_TXT(chatId, "请输入正确的JSON参数")
    }
    const Tmss = await Admin123(json)
    const Tmjson:any = await Tmss.json()
    if (Tmjson.code == 200) {
        return return_TXT(chatId, `处理成功|${json.user.email}`)
    }else{
        return return_TXT(chatId, `处理失败|${JSON.stringify(Tmjson)}`)
    }

}
// 统一回复信息
async function return_TXT( id: any,Txt: string) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const payload = { chat_id: id, text: Txt };
    const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const data = await resp.json().catch(() => ({}));
    return JsonOk({ ok: true, tg: data }, 200);
}

//调用API接口处理Team
async function Admin123(params: any) {
    const apiUrl = "https://pyapi.my91.my/TeamAdmin123";
    return await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            session: params, 
        }),
    });
}