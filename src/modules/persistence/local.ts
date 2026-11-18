import {createGame,stepWithClock} from '../simulation/engine';
import {migrateState} from '../management/model';
import {actionSchema,newGameSchema} from '../../server/schema';
import {parseSave,restoreSave,exportSave} from './backup';
import {validateState} from './validation';
import type {GameState,Delta} from '../simulation/types';
export const LOCAL_MODE=process.env.NEXT_PUBLIC_STORAGE_MODE==='local';
interface Stored {state:GameState;updated:number;backups:unknown[]}
let database:Promise<IDBDatabase>|undefined;
function db(){return database??=new Promise((resolve,reject)=>{const r=indexedDB.open('empire-x',3);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('saves'))db.createObjectStore('saves',{keyPath:'state.id'});for(const name of ['ledger','journal','receipts','meta'])if(!db.objectStoreNames.contains(name)){const s=db.createObjectStore(name,{keyPath:'key'});s.createIndex('game_id','game_id');if(name==='ledger'||name==='journal')s.createIndex('chronological',['game_id','second','sequence']);}};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(new Error('No se pudo abrir el guardado del navegador.'));});}
function add(tx:IDBTransaction,game_id:string,d:Delta){for(const e of [...d.entries,...(d.enterpriseEntries||[]).filter(e=>e.facilityId!=='retail-main')])tx.objectStore('ledger').add({...e,game_id,key:`${game_id}|${e.id}`,sequence:Number(e.id.split('-').at(-1)),lines:JSON.stringify(e.lines)});for(const e of d.managementLogs||[])tx.objectStore('journal').add({...e,game_id,key:`${game_id}|${e.id}`,sequence:Number(e.id.split('-').at(-1))});}
async function recoverLegacy(){const raw=localStorage.getItem('empire-x-local-v1');if(!raw)return;const dbs=await db();const key='legacy-v1-recovered';const seen=await new Promise<boolean>((resolve,reject)=>{const r=dbs.transaction('meta').objectStore('meta').get(key);r.onsuccess=()=>resolve(!!r.result);r.onerror=()=>reject(r.error);});if(seen)return;const state=await parseSave(JSON.parse(raw));await localRequest('/api/games/import',{save:state,requestId:crypto.randomUUID(),legacyRaw:raw,legacyMarker:key});}
export async function localRequest(path:string,body?:unknown,method?:string):Promise<unknown>{
 if(path==='/api/session'){let warning;try{await recoverLegacy();}catch(e){warning=`No se pudo migrar el guardado anterior: ${(e as Error).message}. El original se conserva.`;}return {user:{id:'local',email:'Partidas en este navegador'},warning};}
 let importState:GameState|undefined;const inputImport=body as {save:unknown;requestId:string;legacyRaw?:string;legacyMarker?:string};
 if(path==='/api/games/import')importState=await parseSave(inputImport.save);
 const database=await db();
 return new Promise((resolve,reject)=>{
 const tx=database.transaction(['saves','ledger','journal','receipts','meta'],'readwrite'),store=tx.objectStore('saves');let output:unknown;let failure:unknown;
 tx.oncomplete=()=>resolve(output);tx.onerror=()=>reject(failure||new Error('No se pudo guardar. Revisa el espacio disponible.'));tx.onabort=()=>reject(failure||new Error('Operación cancelada; se conservó la partida anterior.'));
 const abort=(e:unknown)=>{failure=e;tx.abort();};
 const get=store.getAll();get.onerror=()=>tx.abort();get.onsuccess=()=>{try{
 const all=get.result as Stored[],parts=path.split('/'),gameId=parts[3];let row=all.find(v=>v.state.id===gameId);
 if(path==='/api/games'&&!body){output={saves:all.map(v=>({id:v.state.id,player_name:v.state.playerName,company_name:v.state.company.name,difficulty:v.state.difficulty,updated_at:v.updated,sim_second:v.state.clock.second})).sort((a,b)=>b.updated_at-a.updated_at)};return;}
 if(path==='/api/games/import'){
  const prior=all.find(v=>v.state.id===inputImport.requestId);if(prior){output={state:prior.state};return;}if(all.length>=8)throw new Error('Puedes mantener hasta 8 partidas.');
  const result=restoreSave(importState!,inputImport.requestId,Date.now());row={state:result.state,updated:Date.now(),backups:[inputImport.legacyRaw||inputImport.save]};add(tx,row.state.id,result.delta);store.add(row);if(inputImport.legacyMarker)tx.objectStore('meta').put({key:inputImport.legacyMarker,game_id:row.state.id});output={state:row.state};return;
 }
 if(path==='/api/games'&&body){const input=newGameSchema.parse(body),prior=all.find(v=>v.state.id===input.requestId);if(prior){output={state:prior.state};return;}if(all.length>=8)throw new Error('Puedes mantener hasta 8 partidas.');const result=createGame(input.requestId,input.playerName,input.companyName,input.difficulty,crypto.getRandomValues(new Uint32Array(1))[0],Date.now());row={state:result.state,updated:Date.now(),backups:[]};add(tx,row.state.id,result.delta);store.add(row);output={state:row.state};return;}
 if(!row)throw new Error('Partida no encontrada.');
 if(method==='DELETE'){store.delete(gameId);for(const name of ['ledger','journal','receipts']){const cursor=tx.objectStore(name).index('game_id').openCursor(IDBKeyRange.only(gameId));cursor.onsuccess=()=>{if(cursor.result){cursor.result.delete();cursor.result.continue();}};}output={ok:true};return;}
 if(row.state.schemaVersion<3){validateState(row.state);row.backups.push(structuredClone(row.state));row.state=migrateState(row.state);store.put(row);}
 if(parts[4]==='commands'){
  const input=actionSchema.parse(body),hash=JSON.stringify(input),receipts=tx.objectStore('receipts'),r=receipts.get(`${gameId}|${input.requestId}`);const current=row;
  r.onsuccess=()=>{try{if(r.result){if(r.result.hash!==hash)throw new Error('Referencia de operación en conflicto.');output={state:current.state};return;}
   const result=stepWithClock(current.state,input.command,Date.now(),input.controller);current.state=result.state;current.updated=Date.now();add(tx,gameId,result.delta);store.put(current);receipts.add({key:`${gameId}|${input.requestId}`,game_id:gameId,hash});output={state:current.state};
  }catch(e){abort(e);}};
 }else if(parts[4]==='ledger'||parts[4]==='management-history'||parts[4]==='enterprise-history'){
  const name=parts[4]==='management-history'?'journal':'ledger',rows:unknown[]=[],range=IDBKeyRange.bound([gameId,0,0],[gameId,Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER]),cursor=tx.objectStore(name).index('chronological').openCursor(range,'prev');cursor.onsuccess=()=>{if(cursor.result&&rows.length<(parts[4]==='ledger'?100:Infinity)){rows.push(cursor.result.value);cursor.result.continue();}else output=parts[4]==='ledger'?{entries:rows}:{records:rows};};
 }else if(parts[4]==='backups')output={backups:row.backups};
 else if(parts[4]==='export')output={state:row.state};
 else{output={state:structuredClone(row.state)};if(Date.now()>row.state.clock.leaseUntilMs)(output as {state:GameState}).state.clock.speed=0;}
 }catch(error){abort(error);}};
 });
}
export async function localExport(id:string){const data=await localRequest(`/api/games/${id}/export`) as {state:GameState};return exportSave(data.state);}
