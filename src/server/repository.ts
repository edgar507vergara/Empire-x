import { PRODUCTS } from '../modules/simulation/config';
import { assertIntegrity } from '../modules/simulation/engine';
import type { GameState, Transition } from '../modules/simulation/types';
export interface Statement {bind(...values:unknown[]):Statement;first<T=Record<string,unknown>>():Promise<T|null>;all<T=Record<string,unknown>>():Promise<{results:T[]}>;run():Promise<unknown>}
export interface Database {prepare(sql:string):Statement;batch(statements:Statement[]):Promise<unknown[]>}
export interface Snapshot {state:GameState;version:number;now_ms:number}
export async function serverTime(db:Database){const row=await db.prepare("select cast(unixepoch('subsec') * 1000 as integer) as now_ms").first<{now_ms:number}>();if(!row)throw new Error('No database time');return row.now_ms;}
export async function load(db:Database,userId:string,id:string):Promise<Snapshot|null>{
  const row=await db.prepare("select state,version,cast(unixepoch('subsec') * 1000 as integer) as now_ms from game_saves where id=? and owner_id=?").bind(id,userId).first<{state:string;version:number;now_ms:number}>();
  return row?{state:JSON.parse(row.state),version:row.version,now_ms:row.now_ms}:null;
}
export async function receipt(db:Database,userId:string,id:string,requestId:string){return db.prepare('select request_hash from command_receipts where game_id=? and owner_id=? and id=?').bind(id,userId,requestId).first<{request_hash:string}>();}
export async function list(db:Database,userId:string){return (await db.prepare('select id,player_name,company_name,difficulty,updated_at,sim_second from game_saves where owner_id=? order by updated_at desc').bind(userId).all()).results;}
/** Every statement participates in ONE D1 transaction. A version trigger aborts stale commits. */
export async function persist(db:Database,userId:string,version:number,requestId:string,hash:string,result:Transition){
  const {state:s,delta:d}=result;assertIntegrity(s);
  const id=s.id,now=await serverTime(db),v=version+1,queries:Statement[]=[];
  const q=(sql:string,...values:unknown[])=>queries.push(db.prepare(sql).bind(...values));
  if(version===-1){
    q('insert into profiles(id,display_name,created_at) values(?,?,?) on conflict(id) do nothing',userId,s.playerName,now);
    q('insert into game_saves(id,owner_id,player_name,company_name,difficulty,version,sim_second,state,created_at,updated_at) values(?,?,?,?,?,?,?,?,?,?)',id,userId,s.playerName,s.company.name,s.difficulty,v,s.clock.second,JSON.stringify(s),now,now);
  }else{
    q("insert into save_backups(game_id,owner_id,id,state,created_at) select id,owner_id,'sprint-'||json_extract(state,'$.schemaVersion'),state,? from game_saves where id=? and owner_id=? and json_extract(state,'$.schemaVersion')<3 on conflict(game_id,id) do nothing",now,id,userId);
    // Do NOT add a version WHERE clause: a stale version must raise and abort the complete batch.
    q('update game_saves set state=?,version=?,sim_second=?,company_name=?,updated_at=? where id=? and owner_id=?',JSON.stringify(s),v,s.clock.second,s.company.name,now,id,userId);
  }
  q('insert into command_receipts(game_id,owner_id,id,request_hash,version) values(?,?,?,?,?)',id,userId,requestId,hash,v);
  q("insert into game_clock(game_id,owner_id,id,second,tick,speed,data) values(?,?,'clock',?,?,?,?) on conflict(game_id,id) do update set second=excluded.second,tick=excluded.tick,speed=excluded.speed,data=excluded.data",id,userId,s.clock.second,s.clock.tick,s.clock.speed,JSON.stringify(s.clock));
  if(version===-1){
    q("insert into world_tiles(game_id,owner_id,id,kind,owned,data) select ?,?,cast(json_extract(value,'$.id') as text),json_extract(value,'$.kind'),json_extract(value,'$.owned'),value from json_each(?)",id,userId,JSON.stringify(s.tiles));
    q("insert into products(game_id,owner_id,id,name,cost,data) select ?,?,json_extract(value,'$.id'),json_extract(value,'$.name'),json_extract(value,'$.cost'),value from json_each(?)",id,userId,JSON.stringify(PRODUCTS));
  }
  if(s.company.tileId!==null){
    q('update world_tiles set owned=1,data=? where game_id=? and owner_id=? and id=?',JSON.stringify(s.tiles[s.company.tileId]),id,userId,String(s.company.tileId));
    q("insert into business_locations(game_id,owner_id,id,tile_id,data) values(?,?,'location-1',?,?) on conflict(game_id,id) do update set data=excluded.data",id,userId,s.company.tileId,JSON.stringify(s.company));
  }
  q("insert into companies(game_id,owner_id,id,name,data) values(?,?,'retail-1',?,?) on conflict(game_id,id) do update set name=excluded.name,data=excluded.data",id,userId,s.company.name,JSON.stringify(s.company));
  q("insert into inventory(game_id,owner_id,id,quantity,value,price) select ?,?,json_extract(value,'$.productId'),json_extract(value,'$.quantity'),json_extract(value,'$.value'),json_extract(value,'$.price') from json_each(?) where true on conflict(game_id,id) do update set quantity=excluded.quantity,value=excluded.value,price=excluded.price",id,userId,JSON.stringify(s.inventory));
  q("insert into employees(game_id,owner_id,id,hired,salary,data) select ?,?,json_extract(value,'$.id'),json_extract(value,'$.hired'),json_extract(value,'$.salary'),value from json_each(?) where true on conflict(game_id,id) do update set hired=excluded.hired,salary=excluded.salary,data=excluded.data",id,userId,JSON.stringify(s.employees));
  q('insert into financial_accounts(game_id,owner_id,id,balance) select ?,?,key,value from json_each(?) where true on conflict(game_id,id) do update set balance=excluded.balance',id,userId,JSON.stringify(s.accounts));
  if(d.entries.length)q("insert into ledger_entries(game_id,owner_id,id,sequence,second,cause,reference,flow,lines) select ?,?,json_extract(value,'$.id'),cast(substr(json_extract(value,'$.id'),7) as integer),json_extract(value,'$.second'),json_extract(value,'$.cause'),json_extract(value,'$.reference'),json_extract(value,'$.flow'),json_extract(value,'$.lines') from json_each(?)",id,userId,JSON.stringify(d.entries));
  if(d.sales.length){
    q("insert into sales(game_id,owner_id,id,second,revenue,cost) select ?,?,json_extract(value,'$.id'),json_extract(value,'$.second'),json_extract(value,'$.revenue'),json_extract(value,'$.cost') from json_each(?)",id,userId,JSON.stringify(d.sales));
    q("insert into sale_items(game_id,owner_id,id,sale_id,product_id,quantity,price,cost) select ?,?,json_extract(value,'$.id'),json_extract(value,'$.id'),json_extract(value,'$.productId'),json_extract(value,'$.quantity'),json_extract(value,'$.unitPrice'),json_extract(value,'$.cost') from json_each(?)",id,userId,JSON.stringify(d.sales));
  }
  if(d.movements.length)q("insert into inventory_movements(game_id,owner_id,id,product_id,quantity,value,second,reference) select ?,?,json_extract(value,'$.id'),json_extract(value,'$.productId'),json_extract(value,'$.quantity'),json_extract(value,'$.value'),json_extract(value,'$.second'),json_extract(value,'$.reference') from json_each(?)",id,userId,JSON.stringify(d.movements));
  if(d.ticks.length)q("insert into simulation_ticks(game_id,owner_id,id,second) select ?,?,json_extract(value,'$.tick'),json_extract(value,'$.second') from json_each(?)",id,userId,JSON.stringify(d.ticks));
  if(s.events.length)q("insert into game_events(game_id,owner_id,id,data) select ?,?,json_extract(value,'$.id'),value from json_each(?) where true on conflict(game_id,id) do update set data=excluded.data",id,userId,JSON.stringify(s.events));
  q('insert into mission_progress(game_id,owner_id,id,completed) select ?,?,cast(key as integer),value from json_each(?) where true on conflict(game_id,id) do update set completed=excluded.completed',id,userId,JSON.stringify(s.missions));
  if(d.managementLogs?.length)q("insert into management_journal(game_id,owner_id,id,second,data) select ?,?,json_extract(value,'$.id'),json_extract(value,'$.second'),value from json_each(?)",id,userId,JSON.stringify(d.managementLogs));
  if(d.enterpriseEntries?.length)q("insert into enterprise_journal(game_id,owner_id,id,second,company_id,facility_id,data) select ?,?,json_extract(value,'$.id'),json_extract(value,'$.second'),json_extract(value,'$.companyId'),json_extract(value,'$.facilityId'),value from json_each(?)",id,userId,JSON.stringify(d.enterpriseEntries));
  await db.batch(queries);return v;
}
