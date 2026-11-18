import {authenticate,apiError,ApiError} from '@/server/auth';
import {z} from 'zod';
import {parseSave,restoreSave,digest} from '@/modules/persistence/backup';
import {persist,receipt,load,serverTime} from '@/server/repository';
export async function POST(req:Request){try{
 const {client,user}=await authenticate(req,16000000);const bytes=await req.text();if(bytes.length>16000000)throw new ApiError('Respaldo demasiado grande.',413);
 const input=z.object({requestId:z.uuid(),save:z.unknown()}).strict().parse(JSON.parse(bytes));const hash=await digest(input.save),prior=await receipt(client,user.id,input.requestId,input.requestId);
 if(prior){if(prior.request_hash!==hash)throw new ApiError('Referencia en conflicto.',409);return Response.json(await load(client,user.id,input.requestId));}
 let source;try{source=await parseSave(input.save);}catch{throw new ApiError('Respaldo inválido o incompatible. La partida original se conserva.',400);}
 const result=restoreSave(source,input.requestId,await serverTime(client));try{await persist(client,user.id,-1,input.requestId,hash,result);}catch(e){const retry=await receipt(client,user.id,input.requestId,input.requestId);if(retry?.request_hash!==hash){if(String(e).includes('save_limit'))throw new ApiError('Puedes mantener hasta 8 partidas.',409);throw e;}}
 return Response.json(await load(client,user.id,input.requestId));
 }catch(e){return apiError(e);}}
