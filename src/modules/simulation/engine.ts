import {workforceCommand,workforceHour,validateWorkforce} from '../workforce/runtime';
import {assignedId,staffEffects,context,effectiveWorker} from '../workforce/model';
import {enterprisePersonnel,enterpriseManagementHour} from '../enterprise/management';
import {postAccounts} from './ledger';
import {enterpriseCommand,settle} from '../enterprise/operations';
import {enterpriseHour} from '../enterprise/runtime';
import {validateEnterprise,facility,incoming} from '../enterprise/model';
import { available, isManager, migrateState } from '../management/model';
import { managementCommand, managementHour, recordDemand, log as managementLog } from '../management/runtime';
import type { ManagedState, Operations } from '../management/types';
import { BALANCE, PRODUCTS, gameDate } from './config';
import { generateWorld } from '../world/generate';
import type { Account, Clock, Command, Delta, Difficulty, Employee, GameState, Transition, DayReport, Entry } from './types';

export class GameError extends Error { constructor(message: string, public code = 'INVALID_ACTION') { super(message); } }
function requireCondition(ok: unknown, message: string): asserts ok { if (!ok) throw new GameError(message); }
function int(n: number, min = 0, max = Number.MAX_SAFE_INTEGER) { requireCondition(Number.isSafeInteger(n) && n >= min && n <= max, 'Valor fuera de los límites permitidos.'); }
function nextId(s: GameState, prefix: string) { return `${prefix}-${++s.sequence}`; }
export const emptyDelta = (): Delta => ({ entries: [], sales: [], movements: [], ticks: [] });
function random(s: GameState) { let x = s.rng | 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; s.rng = x >>> 0; return s.rng / 4294967296; }
function spend(s: GameState, amount: number) { int(amount); requireCondition(s.accounts.cash >= amount, 'No hay efectivo suficiente para esta operación.'); }
function post(s: GameState, d: Delta, cause: string, reference: string, flow: Entry['flow'], lines: Entry['lines']) {
  requireCondition(lines.reduce((n, l) => n + l.amount, 0) === 0, 'Asiento contable descuadrado.');
  postAccounts(s.accounts,lines);
  d.entries.push({ id: nextId(s, 'entry'), second: s.clock.second, cause, reference, flow, lines });
}
function transfer(s: GameState, d: Delta, debit: Account, credit: Account, amount: number, cause: string, reference: string, flow: Entry['flow'] = 'operating') {
  if (amount === 0) return;
  int(amount, 1); post(s, d, cause, reference, flow, [{ account: debit, amount }, { account: credit, amount: -amount }]);
}
function day(s: GameState) { return Math.floor(s.clock.second / 86400); }
function report(s: GameState): DayReport {
  const today = day(s);
  let r = s.history.at(-1);
  if (!r || r.day !== today) { r = { day: today, revenue: 0, cogs: 0, expenses: 0, units: 0, clients: 0, lost: 0, openMinutes: 0 }; s.history.push(r); }
  // Snapshot bounded; complete accounting/sales journals remain in the persistent SQL journal.
  if (s.history.length > 400) s.history.shift();
  return r;
}
function expense(s: GameState, d: Delta, amount: number, cause: string, reference: string) {
  if (!amount) return;
  const paid = Math.min(s.accounts.cash, amount);
  post(s, d, cause, reference, 'operating', [{ account: 'expenses', amount }, { account: 'cash', amount: -paid }, { account: 'payable', amount: -(amount - paid) }].filter(l => l.amount !== 0) as Entry['lines']);
  report(s).expenses += amount;
  if (paid < amount) { s.company.open = false; s.notice = 'Tienda cerrada por falta de liquidez. Hay gastos pendientes de pago.'; }
}
function candidates(seed: number): Employee[] {
  const names = ['Valeria Méndez', 'Mateo Castillo', 'Camila Ríos', 'Andrés Duarte', 'Lucía Torres', 'Daniel Vega', 'Sofía Moreno', 'Gabriel Ruiz'];
  const roles = ['cashier', 'salesperson', 'stocker', 'supervisor'] as const;
  return names.map((name, i) => {
    const p = 55 + ((seed + i * 17) >>> 0) % 36;
    return { id: `candidate-${i}`, name, age: 22 + i * 3, role: roles[i % 4], salary: [65000, 70000, 60000, 95000][i % 4], attributes: { productivity: p, experience: 40 + i * 6, leadership: i % 4 === 3 ? 85 : 30 + i * 5, motivation: 80, loyalty: 65, stress: 15, potential: 95 - i * 3 }, hired: false, dismissed: false, accrued: 0, carry: 0 };
  });
}
export function createGame(id: string, playerName: string, companyName: string, difficulty: Difficulty, seed: number, now: number): Transition {
  requireCondition(['easy', 'normal', 'hard'].includes(difficulty), 'Dificultad no válida.');
  requireCondition(playerName.trim().length >= 2 && playerName.length <= 40 && companyName.trim().length >= 2 && companyName.length <= 60, 'Revisa el nombre del jugador y de la empresa.');
  const initial: GameState = {
    schemaVersion: 1, id, playerName: playerName.trim(), difficulty, seed: seed >>> 0, rng: (seed >>> 0) || 1,
    clock: { second: 8 * 3600, tick: 0, speed: 0, lastRealMs: now, leaseUntilMs: now, controller: null, remainderMs: 0 },
    company: { name: companyName.trim(), tileId: null, built: false, equipped: false, equipmentQuality: 1, open: false, reputation: 60, openedOnce: false, openingFeePaid: false, operatingDays: 0, reportsViewed: 0, marketing: false },
    accounts: { receivable: 0, cash: 0, inventory: 0, fixedAssets: 0, payable: 0, equity: 0, revenue: 0, cogs: 0, expenses: 0 },
    tiles: generateWorld(seed), inventory: PRODUCTS.map(p => ({ productId: p.id, quantity: 0, value: 0, price: p.suggested })), employees: candidates(seed),
    events: [], missions: Array(10).fill(false), history: [], totals: { units: 0, clients: 0, lost: 0, openMinutes: 0 }, sequence: 0, capacityCarry: 0, operatingCarry: 0, marketingCarry: 0, notice: null,
  };
  const s=migrateState(initial); const d = emptyDelta(); transfer(s, d, 'cash', 'equity', BALANCE.initial[difficulty], 'Capital inicial', 'initial-capital', 'financing'); report(s); assertIntegrity(s); return { state: s, delta: d };
}
export function profit(s: GameState) { return -s.accounts.revenue - s.accounts.cogs - s.accounts.expenses; }
export function metrics(s: GameState) {
  const assets = s.accounts.cash + s.accounts.inventory + s.accounts.fixedAssets;
  return { assets, liabilities: -s.accounts.payable, netWorth: assets + s.accounts.payable, profit: profit(s), businessValue: s.accounts.inventory + s.accounts.fixedAssets, revenue: -s.accounts.revenue, expenses: s.accounts.cogs + s.accounts.expenses, payroll: s.employees.filter(e => e.hired&&!e.hr?.facilityId).reduce((n,e) => n+e.salary,0) };
}
export function updateMissions(s: GameState) {
  const conditions = [s.company.tileId !== null, s.company.built, s.inventory.some(i => i.quantity > 0), s.employees.some(e => e.hired && e.role === 'cashier'), s.company.openedOnce, s.totals.units >= 10, s.totals.units >= 100, s.history.some(h => h.day < day(s) && h.revenue > h.cogs + h.expenses), s.company.operatingDays >= 7, s.company.reportsViewed > 0];
  s.missions = s.missions.map((v,i) => v || conditions[i]);
}
export function assertIntegrity(s: GameState) {
  for (const value of Object.values(s.accounts)) int(Math.abs(value));
  requireCondition(Object.values(s.accounts).reduce((a,b) => a+b,0) === 0, 'El balance no cuadra.');
  requireCondition(s.accounts.cash >= 0 && s.accounts.inventory >= 0 && s.accounts.fixedAssets >= 0 && s.accounts.payable <= 0, 'Saldo inválido.');
  requireCondition(s.inventory.reduce((v,i) => v+i.value,0)+(s.enterprise?.shipments.filter(o=>o.toId==='retail-main'&&o.status!=='delivered').reduce((n,o)=>n+o.value,0)||0) === s.accounts.inventory, 'El inventario no coincide con el libro mayor.');
  for (const i of s.inventory) { int(i.quantity); int(i.value); int(i.price,1); requireCondition(i.quantity !== 0 || i.value === 0, 'Valor sin existencias.'); }
  requireCondition(s.employees.filter(e=>e.hired&&assignedId(e)==='retail-main').length <= BALANCE.maxEmployees, 'Capacidad de empleados excedida.');
  for (const e of s.employees) { int(e.accrued); int(e.salary,1); for(const a of Object.values(e.attributes)) int(a,0,100); }
  requireCondition(s.employees.filter(e=>!e.hr?.facilityId).reduce((v,e)=>v+e.accrued,0) <= -s.accounts.payable, 'Salarios sin pasivo.');validateEnterprise(s);validateWorkforce(s);
}
function activeEvent(s: GameState, type: string) { return s.events.some(e=>e.type===type && day(s)<e.expires && (type==='promotion' ? e.choice==='accept' : !e.resolved)); }
export function purchaseCost(s: GameState, productId: string) { const p = PRODUCTS.find(p=>p.id===productId); requireCondition(p,'Producto desconocido.'); return Math.round(p.cost * (activeEvent(s,'discount') ? 0.85 : 1)); }
function operations(s:GameState,d:Delta):Operations { return {
 apply:c=>apply(s,d,c),expense:(amount,cause,ref)=>expense(s,d,amount,cause,ref),purchaseCost:p=>purchaseCost(s,p),log:entry=>{(d.managementLogs??=[]).push(entry);},
 quit:e=>{const paid=Math.min(s.accounts.cash,e.accrued);transfer(s,d,'payable','cash',paid,'Liquidación por renuncia',e.id);e.accrued-=paid;e.arrears=e.accrued;e.hired=false;e.dismissed=true;e.hr!.companyId=null;if(!s.employees.some(v=>v.hired&&v.role==='cashier')){s.company.open=false;s.notice='Tu cajero renunció; contrata un reemplazo para reabrir.';}}
 }; }
function apply(s: GameState, d: Delta, c: Command) {
  if(workforceCommand(s,d,c)||enterprisePersonnel(s,d,c)||enterpriseCommand(s,d,c))return;
  if(managementCommand(s as ManagedState,c,operations(s,d)))return;
  const company = s.company;
  switch(c.type) {
    case 'buy_land': {
      int(c.tileId,0,399); requireCondition(company.tileId===null,'La primera tienda ya tiene parcela. Crea sucursales desde Administración.');
      const t=s.tiles[c.tileId]; requireCondition(t.kind==='available'&&!t.owned,'Esta parcela no está a la venta.'); spend(s,t.price);
      transfer(s,d,'fixedAssets','cash',t.price,'Compra de terreno',`tile-${t.id}`,'investing'); t.owned=true; company.tileId=t.id; break;
    }
    case 'build': requireCondition(company.tileId!==null&&!company.built,'Necesitas un terreno sin construir.'); spend(s,BALANCE.construction); transfer(s,d,'fixedAssets','cash',BALANCE.construction,'Construcción del local','store','investing'); company.built=true; break;
    case 'equip': { requireCondition(company.built&&!company.equipped,'Construye el local antes de equiparlo.'); const cost=c.used?BALANCE.usedEquipment:BALANCE.equipment; spend(s,cost); transfer(s,d,'fixedAssets','cash',cost,c.used?'Equipamiento reacondicionado':'Equipamiento comercial','equipment','investing'); company.equipped=true;company.equipmentQuality=c.used?0.8:1;break; }
    case 'buy_stock': {
      requireCondition(company.built,'Necesitas construir tu tienda.'); int(c.quantity,1,BALANCE.maxStock); const item=s.inventory.find(i=>i.productId===c.productId); requireCondition(item,'Producto desconocido.');
      requireCondition(s.inventory.reduce((v,i)=>v+i.quantity,0)+incoming(s,facility(s,'retail-main'))+c.quantity<=BALANCE.maxStock,'Capacidad de almacén excedida (10,000 unidades).');
      const total=purchaseCost(s,c.productId)*c.quantity; spend(s,total); const ref=nextId(s,'purchase');
      transfer(s,d,'inventory','cash',total,'Compra de mercancía',ref); item.quantity+=c.quantity; item.value+=total;
      d.movements.push({id:nextId(s,'movement'),second:s.clock.second,productId:c.productId,quantity:c.quantity,value:total,reference:ref}); break;
    }
    case 'set_price': { const item=s.inventory.find(i=>i.productId===c.productId); requireCondition(item,'Producto desconocido.'); int(c.price,1,100000); item.price=c.price; break; }
    case 'hire': {
      requireCondition(company.built,'Construye el local antes de contratar.'); const e=s.employees.find(e=>e.id===c.employeeId); requireCondition(e&&available(e,s),'Candidato no disponible.');
      requireCondition(s.employees.filter(e=>e.hired&&!e.hr?.facilityId).length<BALANCE.maxEmployees,'No quedan plazas disponibles.');
      requireCondition(overdue(s)===0,'Liquida tus obligaciones antes de contratar.'); spend(s,BALANCE.hireFee+metrics(s).payroll+e.salary);
      expense(s,d,BALANCE.hireFee,'Contratación',e.id); e.hired=true; e.dismissed=false; e.hr!.hiredAt=s.clock.second;e.hr!.companyId=isManager(e)?null:'retail-1';managementLog(s as ManagedState,operations(s,d),'hired','Contratación registrada',e.id,BALANCE.hireFee); break;
    }
    case 'fire': {
      const e=s.employees.find(e=>e.id===c.employeeId&&e.hired); requireCondition(e,'Empleado no encontrado.'); spend(s,e.accrued);
      transfer(s,d,'payable','cash',e.accrued,'Liquidación de salario devengado',e.id); e.accrued=0; e.arrears=0; e.carry=0; e.hired=false; e.dismissed=true;e.hr!.companyId=null;managementLog(s as ManagedState,operations(s,d),'fired','Despido y liquidación registrados',e.id);
      if(!s.employees.some(e=>e.hired&&!e.hr?.facilityId&&e.role==='cashier')) {company.open=false;s.notice='La tienda necesita un cajero para abrir.';} break;
    }
    case 'set_open':
      if(c.open){ requireCondition(company.built&&company.equipped,'Construye y equipa la tienda.'); requireCondition(s.employees.some(e=>e.hired&&!e.hr?.facilityId&&e.role==='cashier'),'Contrata al menos un cajero.'); requireCondition(s.inventory.some(i=>i.quantity>0),'Compra mercancía para abrir.'); requireCondition(overdue(s)===0,'Existen obligaciones pendientes.');
        if(!company.openingFeePaid){spend(s,BALANCE.openingFee);expense(s,d,BALANCE.openingFee,'Permisos y apertura','opening');company.openingFeePaid=true;} company.openedOnce=true; }
      company.open=c.open; break;
    case 'configure': requireCondition(c.name.trim().length>=2&&c.name.trim().length<=60,'El nombre debe tener entre 2 y 60 caracteres.'); company.name=c.name.trim(); company.marketing=c.marketing; break;
    case 'report': company.reportsViewed++; break;
    case 'event': {
      const e=s.events.find(e=>e.id===c.eventId&&!e.resolved&&day(s)<e.expires); requireCondition(e,'Este evento ya terminó.');
      requireCondition(['raise','complaint','promotion'].includes(e.type),'Este evento se aplica automáticamente.');
      if(c.choice==='accept'){
        if(e.type==='raise'){ const worker=s.employees.find(e=>e.hired&&!e.hr?.facilityId); requireCondition(worker,'No hay empleado solicitante.'); spend(s,Math.ceil(worker.salary*1.1)); worker.salary=Math.ceil(worker.salary*1.1);worker.attributes.motivation=Math.min(100,worker.attributes.motivation+10); }
        if(e.type==='complaint'){spend(s,2500);expense(s,d,2500,'Atención a queja',e.id);company.reputation=Math.min(100,company.reputation+4);}
        if(e.type==='promotion'){spend(s,10000);expense(s,d,10000,'Promoción especial',e.id);}
      } else { if(e.type==='complaint')company.reputation=Math.max(0,company.reputation-5);if(e.type==='raise'){const worker=s.employees.find(e=>e.hired&&!e.hr?.facilityId);if(worker)worker.attributes.motivation=Math.max(0,worker.attributes.motivation-8);} }
      e.resolved=true;e.choice=c.choice;break;
    }
    case 'pay_due': settlePayable(s,d); break;
    case 'speed': case 'heartbeat': case 'pause': break;
    default: throw new GameError('Acción desconocida.');
  }
}
export function command(state: GameState, c: Command): Transition { const s=migrateState(state),d=emptyDelta(); apply(s,d,c);updateMissions(s);assertIntegrity(s);return {state:s,delta:d}; }
function generateEvent(s:GameState) {
  if(day(s)<2||day(s)%3!==2||!s.company.openedOnce)return;
  const types=['demand','discount','raise','cost','complaint','promotion'] as const;
  // Rotating seeded schedule guarantees spacing and avoids immediate repeats.
  const type=types[(Math.floor(day(s)/3)+(s.seed%6))%6];
  const content={demand:['El barrio está de visita','Demanda +30% durante 2 días.'],discount:['Una oferta del proveedor','Compras de mercancía con 15% de descuento durante 2 días.'],raise:['Reconocer el talento','El primer empleado solicita 10% de aumento. Aceptar: motivación +10. Rechazar: −8.'],cost:['Ajuste de servicios','Gastos operativos +25% durante 2 días.'],complaint:['Una experiencia por mejorar','Resolver por $25: reputación +4. Rechazar: −5.'],promotion:['Tu tienda, en el mapa','Invierte $100: demanda +25% durante 2 días.']}[type];
  s.events.push({id:nextId(s,'event'),day:day(s),type,title:content[0],description:content[1],expires:day(s)+2,resolved:false});
  if(s.events.length>100)s.events.shift();
}
function hourlyExpenses(s:GameState,d:Delta,second:number) {
  if(!s.company.built)return;
  const date=gameDate(second-1),daysInMonth=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();
  const divisor=daysInMonth*24;
  for(const e of s.employees.filter(e=>e.hired&&!e.hr?.facilityId)){
    e.carry+=e.salary;const wage=Math.floor(e.carry/divisor);e.carry%=divisor;e.accrued+=wage;
    transfer(s,d,'expenses','payable',wage,'Salario devengado',e.id,'noncash');report(s).expenses+=wage;
  }
  const daily=s.company.open?BALANCE.dailyOperating:BALANCE.dailyClosed;
  s.operatingCarry+=Math.round(daily*(activeEvent(s,'cost')?125:100)*(1-staffEffects(s,context(s,'retail-main')).finance*.12));const amount=Math.floor(s.operatingCarry/2400);s.operatingCarry%=2400;
  expense(s,d,amount,'Servicios y operación',`hour-${Math.floor(second/3600)}`);
  if(s.company.marketing&&s.company.open){s.marketingCarry+=BALANCE.dailyMarketing;const v=Math.floor(s.marketingCarry/24);s.marketingCarry%=24;expense(s,d,v,'Publicidad diaria',`marketing-${Math.floor(second/3600)}`);}
}
function overdue(s:GameState){return Math.max(0,-s.accounts.payable-s.employees.filter(e=>!e.hr?.facilityId).reduce((n,e)=>n+e.accrued,0))+s.employees.filter(e=>!e.hr?.facilityId).reduce((n,e)=>n+(e.arrears||0),0);}
function settlePayable(s:GameState,d:Delta) {
  if(s.enterprise?.shipments.some(o=>o.outstanding&&o.toId==='retail-main')){settle(s,d,facility(s,'retail-main'));return;}
  for(const e of s.employees.filter(e=>!e.hr?.facilityId)){const paid=Math.min(s.accounts.cash,e.accrued);transfer(s,d,'payable','cash',paid,'Pago mensual de salario',e.id);e.accrued-=paid; e.arrears=e.accrued;}
  const nonWage=Math.max(0,-s.accounts.payable-s.employees.filter(e=>!e.hr?.facilityId).reduce((v,e)=>v+e.accrued,0));
  transfer(s,d,'payable','cash',Math.min(nonWage,s.accounts.cash),'Pago de obligaciones','monthly-payables');
  if(s.accounts.payable<0){s.company.open=false;s.notice='Nómina o gastos pendientes. Revisa tus finanzas.';}else{s.notice=null;}
}
function simulateMinute(s:GameState,d:Delta) {
  const previous=s.clock.second, next=previous+60;
  const r=report(s);
  if(s.company.open){
    const team=s.employees.filter(e=>e.hired&&assignedId(e)==='retail-main'),effects=staffEffects(s,context(s,'retail-main')),cashiers=team.filter(e=>e.role==='cashier');
    if(!cashiers.length){s.company.open=false;return;}
    const effective=(e:Employee)=>effectiveWorker(e,'retail',s.clock.second);
    const supervisor=team.find(e=>e.role==='supervisor'||(e.hr?.companyId==='retail-1'&&['general_manager','operations_manager'].includes(e.role)));
    const productivity=1+(supervisor?supervisor.attributes.leadership/500:0);
    const hourlyCapacity=cashiers.reduce((v,e)=>v+45*effective(e),0)*productivity*s.company.equipmentQuality*(1+effects.service);
    s.capacityCarry+=Math.round(hourlyCapacity*1000);let capacity=Math.floor(s.capacityCarry/60000);s.capacityCarry%=60000;
    const variety=s.inventory.filter(i=>i.quantity>0).length/PRODUCTS.length;
    const availability=0.72+Math.min(0.28,effects.stock+team.filter(e=>e.role==='stocker').reduce((v,e)=>v+effective(e)*0.35,0));
    const location=s.tiles[s.company.tileId!].traffic/100;
    const reputation=0.5+s.company.reputation/100;
    const market=(0.92+random(s)*0.16)*(activeEvent(s,'demand')?1.3:1)*(activeEvent(s,'promotion')?1.25:1)*(s.company.marketing?1.15:1);
    const seller=1+effects.sales+effects.quality/2+team.filter(e=>e.role==='salesperson').reduce((v,e)=>v+effective(e)*0.15,0);
    const hour=Math.floor(previous/3600)%24;const traffic=hour>=8&&hour<22?1:0.18;
    // Rotate product traversal so capacity does not systematically favor one SKU.
    const offset=s.clock.tick%PRODUCTS.length;
    for(let j=0;j<PRODUCTS.length;j++){
      const p=PRODUCTS[(j+offset)%PRODUCTS.length],i=s.inventory.find(i=>i.productId===p.id)!;
      const priceFactor=Math.max(0,Math.min(2,2.2-1.2*i.price/p.suggested));
      const expected=p.demand/60*location*reputation*(0.45+0.55*variety)*market*seller*traffic*priceFactor;
      const wanted=Math.floor(expected)+(random(s)<expected%1?1:0);
      const available=Math.min(capacity,Math.floor(wanted*availability)+(random(s)<(wanted*availability)%1?1:0));
      const sold=Math.min(available,i.quantity),lost=Math.max(0,available-i.quantity);
      r.lost+=lost;s.totals.lost+=lost;recordDemand(s as ManagedState,p.id,sold,lost);
      if(sold<=0)continue;
      const cost=sold===i.quantity?i.value:Math.floor(i.value*sold/i.quantity);const revenue=sold*i.price;const saleId=nextId(s,'sale');
      post(s,d,'Venta de mercancía',saleId,'operating',[{account:'cash',amount:revenue},{account:'revenue',amount:-revenue},{account:'cogs',amount:cost},{account:'inventory',amount:-cost}]);
      i.quantity-=sold;i.value-=cost;capacity-=sold;
      d.sales.push({id:saleId,second:previous,productId:p.id,quantity:sold,unitPrice:i.price,revenue,cost});
      d.movements.push({id:nextId(s,'movement'),second:previous,productId:p.id,quantity:-sold,value:-cost,reference:saleId});
      r.revenue+=revenue;r.cogs+=cost;r.units+=sold;r.clients+=sold;s.totals.units+=sold;s.totals.clients+=sold;
    }
    r.openMinutes++;s.totals.openMinutes++;const salesDay=s.management!.dailySales.at(-1);if(salesDay)salesDay.openMinutes++;
  }
  // Charge the ending hour to the day just completed.
  if(Math.floor(previous/3600)!==Math.floor(next/3600))hourlyExpenses(s,d,next);
  s.clock.second=next;s.clock.tick++;
  d.ticks.push({tick:s.clock.tick,second:next});
  if(Math.floor(previous/86400)!==Math.floor(next/86400)){
    s.company.operatingDays=Math.floor(s.totals.openMinutes/1440);
    if(r.units>0)s.company.reputation=Math.max(0,Math.min(100,s.company.reputation+(r.lost>r.units?-1:1)));
    if(gameDate(previous).getUTCMonth()!==gameDate(next).getUTCMonth())settlePayable(s,d);
    generateEvent(s);report(s);
  }
  if(Math.floor(previous/3600)!==Math.floor(next/3600))enterpriseHour(s,d);
  if(Math.floor(previous/3600)!==Math.floor(next/3600)){workforceHour(s,d);managementHour(s as ManagedState,operations(s,d),Math.floor(previous/86400)!==Math.floor(next/86400));enterpriseManagementHour(s,d);}
}
/** Pure deterministic runner, only called by trusted server time or tests. Never accepts client ticks. */
export function advanceTicks(state:GameState,count:number):Transition {
  int(count,0,525600);const s=migrateState(state),d=emptyDelta();
  for(let n=0;n<count;n++)simulateMinute(s,d);
  updateMissions(s);assertIntegrity(s);return {state:s,delta:d};
}
export function mergeDelta(a:Delta,b:Delta):Delta {return {enterpriseEntries:[...(a.enterpriseEntries||[]),...(b.enterpriseEntries||[])],entries:[...a.entries,...b.entries],sales:[...a.sales,...b.sales],movements:[...a.movements,...b.movements],ticks:[...a.ticks,...b.ticks],managementLogs:[...(a.managementLogs||[]),...(b.managementLogs||[])]};}
/** Database time is authoritative; only one live tab holds a short lease. No offline catch-up. */
export function stepWithClock(state:GameState,c:Command,now:number,controller:string):Transition {
  requireCondition(Number.isSafeInteger(now)&&now>=0,'Hora del servidor inválida.');
  const s=structuredClone(state);const clock=s.clock;
  requireCondition(!clock.controller||clock.controller===controller||now>=clock.leaseUntilMs,'Esta partida está abierta en otra pestaña. Espera 15 segundos o pausa allí.');
  let result:Transition={state:s,delta:emptyDelta()};
  const expired=now>clock.leaseUntilMs;
  if(clock.speed>0&&clock.controller===controller&&!expired){
    const elapsed=Math.max(0,now-clock.lastRealMs);
    const simulatedMs=clock.remainderMs+elapsed*BALANCE.secondsPerRealSecond*clock.speed;
    const ticks=Math.floor(simulatedMs/(BALANCE.tickSeconds*1000));
    result=advanceTicks(s,ticks);result.state.clock.remainderMs=simulatedMs%(BALANCE.tickSeconds*1000);
  } else if(expired){result.state.clock.speed=0;result.state.clock.remainderMs=0;}
  const changed=command(result.state,c);result={state:changed.state,delta:mergeDelta(result.delta,changed.delta)};
  if(c.type==='speed'){requireCondition([0,1,2,5,10].includes(c.speed),'Velocidad no válida.');result.state.clock.speed=c.speed;}
  if(c.type==='pause')result.state.clock.speed=0;
  result.state.clock.lastRealMs=now;result.state.clock.leaseUntilMs=now+BALANCE.leaseMs;
  result.state.clock.controller=result.state.clock.speed===0?null:controller;
  return result;
}
