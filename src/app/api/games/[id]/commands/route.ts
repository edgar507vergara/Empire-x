import { authenticate, apiError } from '@/server/auth';
import { execute } from '@/server/games';
import { actionSchema } from '@/server/schema';
import { z } from 'zod';
export const dynamic='force-dynamic';
export async function POST(req:Request,ctx:{params:Promise<{id:string}>}){try{const {client,user}=await authenticate(req);const {id}=await ctx.params;z.uuid().parse(id);const input=actionSchema.parse(await req.json());return Response.json(await execute(client,user.id,id,input));}catch(e){return apiError(e);}}
