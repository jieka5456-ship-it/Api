
export function JsonOk(Data: any, Code = 200) {
  return new Response(JSON.stringify({ Code, Data }), {
    status: 200, // 注意：HTTP 状态可以固定 200，业务码用 Code；或你想一致就 status: Code
    headers: { "Content-Type": "application/json;charset=utf-8" },
  });
}

export function JsonFail(Code: number, Message: string) {
  return new Response(JSON.stringify({ Code, Message }), {
    status: 200, // 同理：也可以用 status: Code，但你说“统一成功code=200”更像业务码
    headers: { "Content-Type": "application/json;charset=utf-8" },
  });
}
