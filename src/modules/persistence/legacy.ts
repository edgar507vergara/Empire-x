import {z} from 'zod';
import {createGame,updateMissions} from '../simulation/engine';
import {migrateState} from '../management/model';
import type {Employee,GameState} from '../simulation/types';
const n=z.number().int().nonnegative(),attribute=n.max(100);
const legacy=z.object({version:z.literal(1),id:z.string().max(100),name:z.string().min(1).max(50),difficulty:z.enum(['easy','normal','hard']),day:n.min(1),seconds:z.number().min(0).max(86400),capital:z.number().int(),seed:n,lots:z.array(z.object({x:n.max(19),y:n.max(19)})).max(1),shop:z.object({name:z.string().max(60),lot:z.object({x:n.max(19),y:n.max(19)}),inventory:z.object({food:n,drink:n,clean:n,home:n}),prices:z.object({food:n.min(1),drink:n.min(1),clean:n.min(1),home:n.min(1)}),open:z.boolean(),days:n}).nullable(),staff:z.array(z.object({id:n,name:z.string().max(80),role:z.enum(['cashier','seller','stocker','supervisor']),skill:attribute,motivation:attribute,loyalty:attribute,hired:n})).max(8),reports:z.array(z.object({day:n,revenue:n,cogs:n,expenses:n,units:n,customers:n,shortages:n})).max(1000),reputation:attribute,customers:n,totalSales:n});
/** Adapter for the previously delivered index.html. Only actual carried balances are transferred. */
export function migrateLegacy(raw:unknown):GameState {
 const old=legacy.parse(raw),s=createGame('legacy-import',old.name.length<2?old.name+' ':old.name.slice(0,40),old.shop?.name||'Mi empresa',old.difficulty,old.seed,0).state;
 s.clock.second=(old.day-1)*86400+Math.floor(old.seconds/60)*60;s.clock.tick=Math.floor(s.clock.second/60);s.sequence=0;
 const hash=(x:number,y:number)=>{const a=Math.sin((x+1)*127.1+(y+1)*311.7+45*17.3)*43758.5453;return a-Math.floor(a);};
 for(const tile of s.tiles){const h=hash(tile.x,tile.y);tile.kind=tile.x===9||tile.y===9||tile.x===10||tile.y===10?'road':h<.22?'park':h<.45?'residential':h<.59?'commercial':h<.66?'industrial':'available';tile.price=600000;tile.owned=false;}
 if(old.lots.length){const lot=old.lots[0];s.company.tileId=lot.y*20+lot.x;s.tiles[s.company.tileId].owned=true;}
 s.company.built=!!old.shop;s.company.equipped=!!old.shop;s.company.open=!!old.shop?.open;s.company.openingFeePaid=!!old.shop;s.company.openedOnce=!!old.shop?.days;s.company.operatingDays=old.shop?.days||0;s.company.reputation=old.reputation;
 const ids=['food','drink','clean','home'] as const,costs=[450,180,550,900];s.inventory.forEach((i,j)=>{if(old.shop){i.quantity=old.shop.inventory[ids[j]];i.value=i.quantity*costs[j];i.price=old.shop.prices[ids[j]];}});
 s.employees=old.staff.map(e=>({id:`legacy-${e.id}`,name:e.name,age:26+e.id%30,role:e.role==='seller'?'salesperson':e.role,salary:{cashier:75000,seller:82000,stocker:69000,supervisor:120000}[e.role],attributes:{productivity:e.skill,experience:50,leadership:e.role==='supervisor'?75:45,motivation:e.motivation,loyalty:e.loyalty,stress:15,potential:75},hired:true,dismissed:false,accrued:0,carry:0}) as Employee);
 const revenue=old.reports.reduce((n,r)=>n+r.revenue,0),cogs=old.reports.reduce((n,r)=>n+r.cogs,0),expenses=old.reports.reduce((n,r)=>n+r.expenses,0),inventory=s.inventory.reduce((n,i)=>n+i.value,0),fixedAssets=old.lots.length*600000+(old.shop?300000:0);
 // A negative legacy cash balance becomes an explicitly identified carried debt, not new spending.
 s.accounts={receivable:0,cash:Math.max(0,old.capital),payable:Math.min(0,old.capital),inventory,fixedAssets,revenue:-revenue,cogs,expenses,equity:-(old.capital+inventory+fixedAssets-revenue+cogs+expenses)};
 s.history=old.reports.slice(-400).map(r=>({day:r.day-1,revenue:r.revenue,cogs:r.cogs,expenses:r.expenses,units:r.units,clients:r.customers,lost:r.shortages,openMinutes:r.units>0?1440:0}));
 // Legacy reports do not record hours; do not invent them for manager forecasts.
 for(const r of s.history)r.openMinutes=0;
 s.totals={units:old.totalSales,clients:old.customers,lost:old.reports.reduce((n,r)=>n+r.shortages,0),openMinutes:(old.shop?.days||0)*1440};
 s.schemaVersion=1;delete s.management;const upgraded=migrateState(s);old.staff.forEach(e=>{upgraded.employees.find(v=>v.id===`legacy-${e.id}`)!.hr!.hiredAt=(Math.max(1,e.hired)-1)*86400;});
 if(old.capital<0){upgraded.company.open=false;upgraded.notice='La deuda del guardado anterior se conserva como obligación pendiente. Págala antes de reabrir.';}
 updateMissions(upgraded);return upgraded;
}
