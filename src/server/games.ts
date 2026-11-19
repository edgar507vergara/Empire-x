import {migrateState} from '../modules/management/model';
import { ApiError } from './errors';
import { createGame,stepWithClock,emptyDelta,assertIntegrity } from '@/modules/simulation/engine';
import type { Command,Difficulty } from '@/modules/simulation/types';
import { load,persist,receipt,serverTime,type Database } from './repository';
async function requestHash(value:unknown){const bytes=new TextEncoder().encode(JSON.stringify(value));const digest=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');}
export async function readGame(db:Database,userId:string,id:string){const value=await load(db,userId,id);if(!value)throw new ApiError('Partida no encontrada.',404);
 if(value.state.schemaVersion<4){const state=migrateState(value.state);assertIntegrity(state);try{await persist(db,userId,value.version,'migration-v4','migration-v4',{state,delta:emptyDelta()});}catch(error){if(!String(error).includes('version_conflict')&&!String(error).includes('UNIQUE constraint'))throw error;}return (await load(db,userId,id))!;}return value;}
export async function newGame(db:Database,userId:string,input:{requestId:string;playerName:string;companyName:string;difficulty:Difficulty}){
  const hash=await requestHash(input),prior=await receipt(db,userId,input.requestId,input.requestId);
  if(prior){if(prior.request_hash!==hash)throw new ApiError('Referencia de partida en conflicto.',409);return readGame(db,userId,input.requestId);}
  const result=createGame(input.requestId,input.playerName,input.companyName,input.difficulty,crypto.getRandomValues(new Uint32Array(1))[0],await serverTime(db));
  try{await persist(db,userId,-1,input.requestId,hash,result);}catch(e){const prior=await receipt(db,userId,input.requestId,input.requestId);if(prior?.request_hash===hash)return readGame(db,userId,input.requestId);if(String(e).includes('save_limit'))throw new ApiError('Puedes mantener hasta 8 partidas.',409);throw e;}
  return readGame(db,userId,input.requestId);
}
export async function execute(db:Database,userId:string,id:string,input:{requestId:string;controller:string;command:Command}){
  const hash=await requestHash({controller:input.controller,command:input.command});
  for(let attempt=0;attempt<4;attempt++){
    const prior=await receipt(db,userId,id,input.requestId);
    if(prior){if(prior.request_hash!==hash)throw new ApiError('Esta referencia pertenece a otra operación.',409);return readGame(db,userId,id);}
    const current=await readGame(db,userId,id),result=stepWithClock(current.state,input.command,current.now_ms,input.controller);
    try{await persist(db,userId,current.version,input.requestId,hash,result);return readGame(db,userId,id);}catch(e){if(String(e).includes('version_conflict')||String(e).includes('UNIQUE constraint failed: command_receipts'))continue;throw e;}
  }
  throw new ApiError('La partida cambió. Reintenta la operación.',409);
}
