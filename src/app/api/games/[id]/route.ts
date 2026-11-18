import { authenticate, apiError } from '@/server/auth';
import { readGame } from '@/server/games';
import { z } from 'zod';
export const dynamic='force-dynamic';
export async function GET(req:Request,ctx:{params:Promise<{id:string}>}){try{const {client,user}=await authenticate(req);const {id}=await ctx.params;z.uuid().parse(id);const data=await readGame(client,user.id,id);if(data.now_ms>data.state.clock.leaseUntilMs)data.state.clock.speed=0;return Response.json(data,{headers:{'Cache-Control':'no-store'}});}catch(e){return apiError(e);}}

export async function DELETE(req:Request,ctx:{params:Promise<{id:string}>}){try{const {client,user}=await authenticate(req);const {id}=await ctx.params;z.uuid().parse(id);await readGame(client,user.id,id);await client.prepare('delete from game_saves where id=? and owner_id=?').bind(id,user.id).run();return Response.json({ok:true});}catch(e){return apiError(e);}}
