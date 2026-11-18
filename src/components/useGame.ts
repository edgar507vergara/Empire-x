'use client';
import {LOCAL_MODE,localRequest,localExport} from '@/modules/persistence/local';
import { useCallback,useEffect,useRef,useState } from 'react';
import type { Command,Difficulty,GameState } from '@/modules/simulation/types';
export interface SavedGame {id:string;company_name:string;player_name:string;difficulty:Difficulty;updated_at:number;sim_second:number}
export interface LedgerRow {id:string;second:number;cause:string;reference:string;flow:string;lines:string}
class HttpError extends Error {constructor(message:string,public status:number){super(message);}}
async function api(path:string,body?:unknown,keepalive=false){
  if(LOCAL_MODE){try{return await localRequest(path,body) as {warning?:string;error?:string;state:GameState;saves:SavedGame[];user:{id:string;email:string};entries:LedgerRow[]};}catch(e){if((e as {code?:string}).code==='INVALID_ACTION'||(e as Error).name==='ZodError')throw new HttpError((e as Error).message,400);throw e;}}
  const r=await fetch(path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,cache:'no-store',keepalive});
  const data=await r.json() as {warning?:string;error?:string;state:GameState;saves:SavedGame[];user:{id:string;email:string};entries:LedgerRow[]};if(!r.ok)throw new HttpError(data.error??'No se pudo completar la solicitud.',r.status);return data;
}
export function useGame(){
  const [user,setUser]=useState<{id:string;email:string}|null>(null),[ready,setReady]=useState(false),[saves,setSaves]=useState<SavedGame[]>([]),[game,setGame]=useState<GameState|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[savedAt,setSavedAt]=useState<number|null>(null),[uncertain,setUncertain]=useState(false);
  const controller=useRef(''),stateRef=useRef(game),locked=useRef(false),pending=useRef<{path:string;body:unknown}|null>(null);
  useEffect(()=>{stateRef.current=game;},[game]);
  const refreshSaves=useCallback(async()=>{try{const data=await api('/api/games');setSaves(data.saves);}catch(e){if(!(e instanceof HttpError&&e.status===401))setError((e as Error).message);}},[]);
  useEffect(()=>{controller.current=crypto.randomUUID();api('/api/session').then(data=>{setUser(data.user);if(data.warning)setError(data.warning);void refreshSaves();}).catch(e=>{if(!(e instanceof HttpError&&e.status===401))setError(e.message);}).finally(()=>setReady(true));},[refreshSaves]);
  const send=useCallback(async(path:string,body:unknown,quiet=false):Promise<boolean>=>{
    if(locked.current)return false;locked.current=true;if(!quiet)setBusy(true);setError(null);pending.current={path,body};
    try{
      let data;
      for(let n=0;n<2;n++){try{data=await api(path,body);break;}catch(e){if(e instanceof HttpError&&e.status<500){pending.current=null;setUncertain(false);throw e;}if(n===1)throw e;}}
      if(!data)throw new Error('No se recibió confirmación del servidor.');setGame(data.state);stateRef.current=data.state;setSavedAt(Date.now());setUncertain(false);pending.current=null;return true;
    }catch(e){setError((e as Error).message);if(pending.current)setUncertain(true);return false;}finally{locked.current=false;setBusy(false);}
  },[]);
  const act=useCallback(async(command:Command)=>{
    if(!stateRef.current||pending.current)return false;
    return send(`/api/games/${stateRef.current.id}/commands`,{requestId:crypto.randomUUID(),controller:controller.current,command},command.type==='heartbeat');
  },[send]);
  const retry=useCallback(async()=>{const p=pending.current;if(p)return send(p.path,p.body);return false;},[send]);
  const load=useCallback(async(id:string)=>{if(locked.current||pending.current)return false;setBusy(true);setError(null);try{const data=await api(`/api/games/${id}`);setGame(data.state);stateRef.current=data.state;setSavedAt(Date.now());return true;}catch(e){setError((e as Error).message);return false;}finally{setBusy(false);}},[]);
  const create=async(input:{playerName:string;companyName:string;difficulty:Difficulty})=>{const ok=await send('/api/games',{...input,requestId:crypto.randomUUID()});if(ok)void refreshSaves();return ok;};
  useEffect(()=>{const timer=setInterval(()=>{if(stateRef.current?.clock.speed&&!document.hidden)void act({type:'heartbeat'});},2000);return()=>clearInterval(timer);},[act]);
  useEffect(()=>{
    const pause=()=>{const s=stateRef.current;if(s?.clock.speed){void api(`/api/games/${s.id}/commands`,{requestId:crypto.randomUUID(),controller:controller.current,command:{type:'pause'}},true).then(data=>{setGame(data.state);stateRef.current=data.state;}).catch(()=>{/* Lease expiry prevents offline catch-up if the network is gone. */});}};
    const visibility=()=>{if(document.hidden)pause();else if(stateRef.current)void load(stateRef.current.id);};
    window.addEventListener('pagehide',pause);document.addEventListener('visibilitychange',visibility);
    return()=>{window.removeEventListener('pagehide',pause);document.removeEventListener('visibilitychange',visibility);};
  },[load]);
  const leave=async()=>{if(game){if(!await act({type:'pause'}))return false;}setGame(null);stateRef.current=null;void refreshSaves();return true;};
  const ledger=async()=>{if(!game)return[];return (await api(`/api/games/${game.id}/ledger`)).entries as LedgerRow[];};
  const deleteSave=async(id:string)=>{if(locked.current||pending.current)return false;setBusy(true);try{if(LOCAL_MODE){await localRequest(`/api/games/${id}`,undefined,'DELETE');await refreshSaves();return true;}const r=await fetch(`/api/games/${id}`,{method:'DELETE',headers:{'Content-Type':'application/json'}});const d=await r.json() as {error?:string};if(!r.ok)throw new Error(d.error||'No se pudo eliminar la partida.');await refreshSaves();return true;}catch(e){setError((e as Error).message);return false;}finally{setBusy(false);}};
  const exportGame=async()=>{if(!stateRef.current)return;const id=stateRef.current.id;try{const data=LOCAL_MODE?await localExport(id):await fetch(`/api/games/${id}/export`).then(async r=>{if(!r.ok)throw new Error('No se pudo exportar.');return r.json();});const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`empire-x-${id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){setError((e as Error).message);}};
  const downloadArchive=async(kind:'management-history'|'enterprise-history'|'backups')=>{if(!stateRef.current)return;const id=stateRef.current.id;try{const data=LOCAL_MODE?await localRequest(`/api/games/${id}/${kind}`):await fetch(`/api/games/${id}/${kind}`).then(async r=>{if(!r.ok)throw new Error('No se pudo descargar el archivo.');return r.json();});const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`empire-x-${kind}-${id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){setError((e as Error).message);}};
  const importGame=async(file:File)=>{if(file.size>16000000){setError('El respaldo supera 16 MB.');return false;}try{const save=JSON.parse(await file.text());const ok=await send('/api/games/import',{save,requestId:crypto.randomUUID()});if(ok)await refreshSaves();return ok;}catch(e){setError((e as Error).message);return false;}};
  return {downloadArchive,exportGame,importGame,deleteSave,user,ready,saves,game,busy,error,setError,savedAt,uncertain,act,retry,load,create,leave,ledger};
}
