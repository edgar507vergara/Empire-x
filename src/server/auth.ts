import 'server-only';
import { env } from 'cloudflare:workers';
import {ApiError} from './errors';
export {ApiError} from './errors';
export function isConfigured(){return Boolean(env.DB);}
export async function authenticate(request:Request,maxBytes=8192){
  const userId=request.headers.get('oai-authenticated-user-id');
  if(!userId)throw new ApiError('Inicia sesión para continuar.',401);
  if(!env.DB)throw new ApiError('La base de datos del juego todavía no está disponible.',503);
  if(request.method!=='GET'){
    const origin=request.headers.get('origin');
    if(origin&&origin!==new URL(request.url).origin)throw new ApiError('Origen no permitido.',403);
    if(!request.headers.get('content-type')?.includes('application/json'))throw new ApiError('Formato no permitido.',415);
    if(Number(request.headers.get('content-length')??0)>maxBytes)throw new ApiError('Solicitud demasiado grande.',413);
  }
  return {client:env.DB,user:{id:userId,email:request.headers.get('oai-authenticated-user-email')??''}};
}
export function apiError(error:unknown){
  if(error instanceof ApiError)return Response.json({error:error.message},{status:error.status});
  if(error instanceof Error&&error.name==='ZodError')return Response.json({error:'Revisa los campos de la operación.'},{status:400});
  if(error instanceof Error&&'code' in error&&error.code==='INVALID_ACTION')return Response.json({error:error.message},{status:409});
  console.error('[empire-x]',error instanceof Error?error.message:'Unexpected error');
  return Response.json({error:'No se pudo confirmar la operación. Reintenta con la misma referencia.'},{status:500});
}
