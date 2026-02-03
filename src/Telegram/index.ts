
import { JsonOk } from "../Message";
const BOT_TOKEN = "8585538929:AAE4PJx19Lp9YlyJAJzb1fpsj_b7-bhsAfE"
export async function TgPost(Req: any, Env: any) {
    const update: any = await Req.json().catch(() => null);
    const chatId = update?.message?.chat?.id;
    const text = update?.message?.text ?? "";
    //先判断用户ID是否存在
    if (!chatId) {
        return JsonOk({ ok: true, reason: "用户ID不存在" }, 200);
    }

    // 判断文本是否存在
    let json: any = null;
    try {
        json = JSON.parse(text);
    } catch (e) {
        json = null;
    }
    if (!json) {
        if(text==="/start"){
            return return_TXT(chatId, "👋 欢迎使用Team自助机器人！")
        }else{
            return return_TXT(chatId, "请输入完整的JSON参数")
        }
    }
    let Tmss: any = null
    let Tmjson:any = null
    if(json?.account?.planType === "plus"){
        return return_TXT(chatId, "处理失败: 已开通Plus")
    }else if(json?.account?.planType === "free"){
        Tmss = await TeamPay(json)
    }else if(json?.account?.planType === "team"){
        Tmss = await Admin123(json)
    }else{
        return return_TXT(chatId, "下单失败: 参数异常")
    }

    Tmjson = await Tmss.json()
    if (Tmjson.code == 200) {
        if(Tmjson.data.Payurl){
            return return_TXT(chatId, `下单成功| ${Tmjson.data.Payurl}`)
        }else{
            return return_TXT(chatId, `处理成功| ${json.user.email}`)
        }
        
    }else{
        return return_TXT(chatId, `处理失败|${JSON.stringify(Tmjson)}`)
    }

}
// 统一回复信息
async function return_TXT( id: any,Txt: string) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const payload = { chat_id: id, text: Txt };
    console.log("TG_SEND ->", JSON.stringify(payload));
    const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const data = await resp.json().catch(() => ({}));
    console.log("TG_SEND_STATUS:", data);
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

//调用接口Team下单
async function TeamPay(params: any) {
    const apiUrl = "https://pyapi.my91.my/BusinessPayurl";
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