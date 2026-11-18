import { authenticate, apiError } from '@/server/auth';
import { newGameSchema } from '@/server/schema';
import { newGame } from '@/server/games';
import { list } from '@/server/repository';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{const {client,user}=await authenticate(req);return Response.json({saves:await list(client,user.id)},{headers:{'Cache-Control':'no-store'}});}catch(e){return apiError(e);}}
export async function POST(req:Request){try{const {client,user}=await authenticate(req);const input=newGameSchema.parse(await req.json());return Response.json(await newGame(client,user.id,input),{status:201});}catch(e){return apiError(e);}}
