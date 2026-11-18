import {initializeEnterprise} from '../enterprise/model';
import {WORKER_ROLES} from '../enterprise/registry';
import { BALANCE, PRODUCTS, gameDate } from '../simulation/config';
import type { Employee, GameState, Role } from '../simulation/types';
import { MANAGER_ROLES, type ManagedState, type ManagerRole, type ManagerConfig, type Skill, type Trait } from './types';
export const SKILLS:Record<Skill,string>={productivity:'Productividad',leadership:'Liderazgo',finance:'Finanzas',negotiation:'Negociación',commerce:'Inteligencia comercial',creativity:'Creatividad',organization:'Organización',honesty:'Honestidad',loyalty:'Lealtad',motivation:'Motivación',stressResistance:'Resistencia al estrés',learning:'Aprendizaje'};
export const STRATEGIES={profit:'Maximizar beneficios',sales:'Incrementar ventas',competitive:'Precios competitivos',liquidity:'Priorizar liquidez',slow_stock:'Reducir inventario lento',balanced:'Crecimiento equilibrado'};
export const RESPONSIBILITIES={purchases:'Compras e inventario',prices:'Precios',hiring:'Contratación',training:'Capacitación',finance:'Control financiero',production:'Producción',transport:'Rutas y entregas',maintenance:'Mantenimiento',investment:'Equipos y ampliaciones'};
export const COURSES=[{id:'leadership',name:'Liderazgo',skill:'leadership',cost:15000,days:4,level:2},{id:'sales',name:'Ventas',skill:'commerce',cost:9000,days:3,level:1},{id:'finance',name:'Finanzas',skill:'finance',cost:16000,days:5,level:2},{id:'service',name:'Atención al cliente',skill:'motivation',cost:6000,days:2,level:1},{id:'organization',name:'Organización',skill:'organization',cost:8000,days:3,level:1},{id:'operations',name:'Operaciones',skill:'productivity',cost:10000,days:4,level:1}] as const;
export const dayOf=(s:GameState)=>Math.floor(s.clock.second/86400);
export const monthOf=(s:GameState)=>gameDate(s.clock.second).toISOString().slice(0,7);
export const clamp=(n:number,min=0,max=100)=>Math.max(min,Math.min(max,Math.round(n)));
export function noise(seed:number,key:string){let h=seed>>>0;for(const c of key){h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;}h^=h>>>16;h=Math.imul(h,0x85ebca6b);h^=h>>>13;h=Math.imul(h,0xc2b2ae35);h^=h>>>16;return (h>>>0)/4294967296;}
export const isManager=(e:Employee)=>MANAGER_ROLES.includes(e.role as ManagerRole);
export const skill=(e:Employee,key:Skill)=>e.attributes[key]??50;
export function defaultConfig(role:Role,s:GameState):ManagerConfig {return {autonomy:'manual',responsibilities:role==='restaurant_manager'||role==='fuel_manager'?['purchases','prices','hiring','maintenance']:role==='hotel_manager'?['prices','purchases','maintenance']:role==='logistics_manager'?['transport','maintenance','investment']:role==='industrial_manager'?['purchases','production','maintenance','investment']:role==='general_manager'?['purchases','prices','hiring','training','finance']:role==='inventory_manager'?['purchases']:role==='commercial_manager'?['prices']:role==='finance_manager'?['finance']:role==='hr_manager'?['hiring','training']:['hiring'],limits:{perPurchase:50000,daily:100000,monthly:1500000,hiringLimit:1,priceRange:10,risk:35,reserve:150000},strategy:'balanced',spentDay:0,spentMonth:0,day:dayOf(s),month:monthOf(s),hires:0,learning:0};}
export function enrich(e:Employee,s:GameState){
 for(const key of Object.keys(SKILLS) as Skill[])if(e.attributes[key]===undefined)e.attributes[key]=clamp(35+noise(s.seed,`${e.id}-${key}`)*55);
 if(e.hr)return;
 const combos:Trait[][]=[['Analítico','Conservador'],['Innovador','Arriesgado'],['Disciplinado','Leal'],['Sociable','Ambicioso'],['Competitivo','Analítico']];
 e.hr={companyId:e.hired?'retail-1':null,hiredAt:e.hired?s.clock.second:null,level:Math.max(1,Math.floor(e.attributes.experience/25)),xp:e.attributes.experience*20,traits:combos[Math.floor(noise(s.seed,e.id)*combos.length)],expectedSalary:e.salary,favorite:false,rejected:false,expires:dayOf(s)+7,unhappyDays:0,causes:[],lastEventDay:-30,training:null,manager:isManager(e)?defaultConfig(e.role,s):null};
}
export function refreshMarket(s:ManagedState){
 const week=Math.floor(dayOf(s)/7);if(s.management.marketWeek===week)return;
 s.management.marketWeek=week;
 // Departed workers with unpaid wages are retained. Favorites remain inspectable, but expired candidates cannot be hired.
 s.employees=s.employees.filter(e=>e.hired||e.accrued>0||e.hr?.favorite||e.dismissed||e.id.startsWith('candidate-')||Number(e.hr?.expires)>dayOf(s));
 const first=['Natalia','Luis','Isabel','Diego','Ana','Tomás','Elena','Javier','Mariana','Carlos','Paula','Gabriel'];const last=['Morales','Vega','Paredes','Ruiz','Rojas','Santos','Castro','Méndez'];
 const roles:Role[]=['cashier','salesperson','stocker','supervisor',...MANAGER_ROLES,...WORKER_ROLES];
 for(let n=0;n<roles.length+4;n++){
  const id=`talent-${week}-${n}`,roll=noise(s.seed,id),exceptional=roll>.965,role=roles[n%roles.length];
  const e:Employee={id,name:`${first[Math.floor(noise(s.seed,id+'n')*first.length)]} ${last[Math.floor(noise(s.seed,id+'l')*last.length)]}`,age:22+Math.floor(roll*30),role,salary:1,attributes:{productivity:50,experience:clamp(roll*90),leadership:50,motivation:80,loyalty:65,stress:15,potential:75},hired:false,dismissed:false,accrued:0,carry:0};
  for(const key of Object.keys(SKILLS) as Skill[])e.attributes[key]=clamp((exceptional?78:38)+noise(s.seed,id+key)*(exceptional?20:49));
  const avg=Object.keys(SKILLS).reduce((n,k)=>n+skill(e,k as Skill),0)/12;
  e.salary=Math.round((isManager(e)?68000:33000)+avg*450+e.attributes.experience*200+(exceptional?45000:0));enrich(e,s);e.hr!.expectedSalary=e.salary;e.hr!.expires=(week+1)*7;s.employees.push(e);
 }
}
/** Additive, deterministic migration: retains all Sprint 1 money, inventory, employment and clock fields. */
export function migrateState(input:GameState):ManagedState {
 if(input.schemaVersion!==1&&input.schemaVersion!==2&&input.schemaVersion!==3)throw new Error('Versión de partida no compatible.');
 const s=structuredClone(input) as ManagedState;
 s.management??={marketWeek:-1,dailySales:[],decisions:[],logs:[],notifications:[],incidents:[],reports:[],evaluations:[],cooldowns:{}};
 for(const e of s.employees)enrich(e,s);
 s.accounts.receivable??=0;s.schemaVersion=3;refreshMarket(s);initializeEnterprise(s);for(const e of [...s.enterprise!.companies,...s.enterprise!.facilities])e.accounts.receivable??=0;return s;
}
export const available=(e:Employee,s:GameState)=>!e.hired&&!e.dismissed&&!e.hr?.rejected&&(e.id.startsWith('candidate-')||Number(e.hr?.expires)>dayOf(s));
export function teamCapacity(s:GameState){return s.employees.filter(e=>e.hired&&!e.hr?.facilityId&&e.role==='cashier').reduce((n,e)=>n+45*e.attributes.productivity/100*(.6+e.attributes.motivation/250)*(1-e.attributes.stress/250)*(e.hr?.training?.ends&&e.hr.training.ends>s.clock.second ? .85 : 1),0)*s.company.equipmentQuality;}
export function payroll(s:GameState){return s.employees.filter(e=>e.hired&&!e.hr?.facilityId).reduce((n,e)=>n+e.salary,0);}
export function observed(s:ManagedState,productId=PRODUCTS[0].id){
 const product=PRODUCTS.find(p=>p.id===productId)!,stock=s.inventory.find(i=>i.productId===productId)!;
 const days=s.management.dailySales.filter(d=>d.day<dayOf(s)).slice(-7),minutes=days.reduce((n,d)=>n+d.openMinutes,0),units=days.reduce((n,d)=>n+(d.units[productId]||0),0),lost=days.reduce((n,d)=>n+(d.lost[productId]||0),0);
 const history=s.history.filter(h=>h.day<dayOf(s)).slice(-7),hired=s.employees.filter(e=>e.hired&&!e.hr?.facilityId);
 return {cash:s.accounts.cash,stock:stock.quantity,dailyDemand:minutes>=240?(units+lost)/Math.max(1,minutes/1440):product.demand*12,demandSource:minutes>=240?`${units} ventas y ${lost} faltantes observados / ${Math.round(minutes/60)} h abiertas`:'Estimación inicial del mercado; aún no hay historial suficiente',capacity:teamCapacity(s),payroll:payroll(s),upcoming:Math.max(-s.accounts.payable,payroll(s))+BALANCE.dailyOperating*7,warehouseFree:BALANCE.maxStock-s.inventory.reduce((n,i)=>n+i.quantity,0),revenue:history.reduce((n,h)=>n+h.revenue,0),profit:history.reduce((n,h)=>n+h.revenue-h.cogs-h.expenses,0),units:history.reduce((n,h)=>n+h.units,0),lost:history.reduce((n,h)=>n+h.lost,0),openMinutes:history.reduce((n,h)=>n+h.openMinutes,0),satisfaction:hired.length?hired.reduce((n,e)=>n+e.attributes.motivation,0)/hired.length:0,reputation:s.company.reputation,price:stock.price,unitCost:product.cost};
}
