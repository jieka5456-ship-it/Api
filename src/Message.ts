
//统一错误返回格式
export function JsonFail(Code:number,Message:string){
    return new Response(
    JSON.stringify({ Code, Message }),
    { status: Code, headers: { "Content-Type": "application/json" } }
  );
}