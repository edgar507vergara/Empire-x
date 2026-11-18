import {authenticate,apiError} from '@/server/auth';
import {readGame} from '@/server/games';
export async function GET(req:Request,ctx:{params:Promise<{id:string}>}){try{const {client,user}=await authenticate(req),{id}=await ctx.params;await readGame(client,user.id,id);const backups=await client.prepare('SELECT state FROM save_backups WHERE game_id=? AND owner_id=?').bind(id,user.id).all<{state:string}>();return Response.json({backups:backups.results.map(v=>JSON.parse(v.state))},{headers:{'Cache-Control':'no-store'}});}catch(e){return apiError(e);}}
