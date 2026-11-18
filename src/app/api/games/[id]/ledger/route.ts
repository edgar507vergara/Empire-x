import { authenticate, apiError } from '@/server/auth';
import { z } from 'zod';
export const dynamic='force-dynamic';
export async function GET(req:Request,ctx:{params:Promise<{id:string}>}){try{const {client,user}=await authenticate(req);const {id}=await ctx.params;z.uuid().parse(id);const {results}=await client.prepare('select * from ledger_entries where game_id=? and owner_id=? order by sequence desc limit 100').bind(id,user.id).all();return Response.json({entries:results},{headers:{'Cache-Control':'no-store'}});}catch(e){return apiError(e);}}
