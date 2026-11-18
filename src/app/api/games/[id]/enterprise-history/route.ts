import {authenticate,apiError} from '@/server/auth';
import {readGame} from '@/server/games';
export async function GET(req:Request,ctx:{params:Promise<{id:string}>}){try{const {client,user}=await authenticate(req),{id}=await ctx.params;await readGame(client,user.id,id);const records=await client.prepare('SELECT data FROM enterprise_journal WHERE game_id=? AND owner_id=? ORDER BY second,id').bind(id,user.id).all<{data:string}>();return Response.json({records:records.results.map(v=>JSON.parse(v.data))},{headers:{'Cache-Control':'no-store'}});}catch(e){return apiError(e);}}
