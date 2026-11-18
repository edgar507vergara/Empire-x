import {authenticate,apiError} from '@/server/auth';
import {readGame} from '@/server/games';
import {exportSave} from '@/modules/persistence/backup';
export async function GET(req:Request,ctx:{params:Promise<{id:string}>}){try{const {client,user}=await authenticate(req),{id}=await ctx.params;const {state}=await readGame(client,user.id,id);return Response.json(await exportSave(state),{headers:{'Cache-Control':'no-store'}});}catch(e){return apiError(e);}}
