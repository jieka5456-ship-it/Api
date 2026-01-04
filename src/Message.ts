
//统一返回格式
export function JsonFail(Code: number, Message: string, httpStatus = 200) {
  return new Response(
    JSON.stringify({ Code, Message }),
    {
      status: httpStatus,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export function JsonOk(Data: any = null, Code = 0) {
  return new Response(
    JSON.stringify({ Code, Data }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
