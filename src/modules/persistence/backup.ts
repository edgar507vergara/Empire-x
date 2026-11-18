import {migrateLegacy} from './legacy';
import {validateState} from './validation';
import type {GameState,Entry,Transition} from '../simulation/types';
import {migrateState} from '../management/model';
import {emptyDelta} from '../simulation/engine';
export async function digest(value:unknown){const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));return [...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join('');}
export async function exportSave(state:GameState){const paused=structuredClone(state);paused.clock.speed=0;paused.clock.controller=null;return {format:'empire-x-save',version:3,exportedAt:new Date().toISOString(),state:paused,checksum:await digest(paused)};}
export async function parseSave(raw:unknown){if(Array.isArray((raw as {backups?:unknown[]})?.backups)){const backups=(raw as {backups:unknown[]}).backups;if(!backups.length)throw new Error('No hay respaldos anteriores.');raw=typeof backups[0]==='string'?JSON.parse(backups[0]):backups[0];}if((raw as {version?:number;schemaVersion?:number})?.version===1&&!(raw as {schemaVersion?:number}).schemaVersion)return validateState(migrateLegacy(raw));const data=raw as {format?:string;checksum?:string;state?:unknown};if(data?.format==='empire-x-save'){if(data.checksum!==await digest(data.state))throw new Error('La integridad del respaldo no coincide.');return validateState(data.state);}return validateState(raw);}
export function restoreSave(source:GameState,id:string,now:number):Transition{
 const state=migrateState(source);state.id=id;state.clock.speed=0;state.clock.controller=null;state.clock.lastRealMs=now;state.clock.leaseUntilMs=now;state.clock.remainderMs=0;
 const delta=emptyDelta();
 // Opening balances are explicit carried balances, not sales, purchases or fictional cash flows.
 delta.entries.push({id:`entry-${++state.sequence}`,second:state.clock.second,cause:'Saldos trasladados desde respaldo · sin nueva operación',reference:'import-opening-balances',flow:'noncash',lines:Object.entries(state.accounts).filter(([,amount])=>amount!==0).map(([account,amount])=>({account,amount})) as Entry['lines']});
 for(const e of [...state.enterprise!.companies.map(c=>({id:c.id,companyId:c.id,accounts:c.accounts})),...state.enterprise!.facilities]){(delta.enterpriseEntries??=[]).push({id:`entry-${++state.sequence}`,second:state.clock.second,cause:'Saldos trasladados de sucursal · sin operación nueva',reference:'import-opening-balances',flow:'noncash',lines:Object.entries(e.accounts).filter(([,amount])=>amount!==0).map(([account,amount])=>({account,amount})) as Entry['lines'],companyId:e.companyId,facilityId:e.id,internal:false});}
 state.notice='Partida importada como copia. El libro comienza con saldos trasladados; no se han generado ventas ni compras por la importación.';
 return {state,delta};
}
