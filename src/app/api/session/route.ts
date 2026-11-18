import { authenticate,apiError } from '@/server/auth';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{const {user}=await authenticate(req);return Response.json({user},{headers:{'Cache-Control':'no-store'}});}catch(e){return apiError(e);}}
