//team.ts
//团队项目Api
import { JsonFail } from '../Message'
export async function handleTeam(req: Request, env: any) {
  const Body = await req.json();


  return JsonFail(200,"800");
}