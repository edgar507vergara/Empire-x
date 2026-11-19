import {assignedId,permissions,managerFit,staffEffects,context} from '../workforce/model';
import type { Command, Employee, GameState } from '../simulation/types';
import { BALANCE, PRODUCTS } from '../simulation/config';
import { available, clamp, COURSES, dayOf, defaultConfig, isManager, monthOf, noise, observed, payroll, refreshMarket, skill, teamCapacity } from './model';
import { MANAGER_ROLES, type Action, type Decision, type HRIncident, type ManagedState, type ManagementCommand, type Notice, type Operations, type Responsibility, type Skill } from './types';
const requireOk=(ok:unknown,message:string)=>{if(!ok)throw Object.assign(new Error(message),{code:'INVALID_ACTION'});};
const id=(s:GameState,prefix:string)=>`${prefix}-${++s.sequence}`;
export function log(s:ManagedState,ops:Operations,type:string,description:string,employeeId:string|null=null,cost=0,data?:unknown,decisionId?:string){const entry={id:id(s,'hrlog'),second:s.clock.second,companyId:s.employees.find(e=>e.id===employeeId)?.hr?.companyId||'retail-1',type,description,employeeId,cost,data,decisionId};s.management.logs.push(entry);if(s.management.logs.length>160)s.management.logs.shift();ops.log(entry);}
export function notify(s:ManagedState,key:string,title:string,detail:string,category:Notice['category']='Gerencia',priority:Notice['priority']='info',cooldown=86400){
 const last=s.management.cooldowns[key];if(last!==undefined&&s.clock.second-last<cooldown)return;
 s.management.cooldowns[key]=s.clock.second;s.management.notifications.push({id:id(s,'notice'),second:s.clock.second,category,priority,title,detail,key,read:false});if(s.management.notifications.length>100)s.management.notifications.shift();
 if(Object.keys(s.management.cooldowns).length>250)for(const [k,v] of Object.entries(s.management.cooldowns))if(s.clock.second-v>86400*30)delete s.management.cooldowns[k];
}
function period(s:ManagedState,e:Employee){const c=e.hr!.manager!;if(c.day!==dayOf(s)){c.day=dayOf(s);c.spentDay=0;}if(c.month!==monthOf(s)){c.month=monthOf(s);c.spentMonth=0;c.hires=0;}return c;}
function responsibility(a:Action):Responsibility{return a.type==='hr_control_costs'?'finance':a.type==='buy_stock'?'purchases':a.type==='set_price'?'prices':a.type==='hire'?'hiring':'training';}
function costOf(s:ManagedState,a:Action,ops:Operations){return a.type==='buy_stock'?ops.purchaseCost(a.productId)*a.quantity:a.type==='hire'?BALANCE.hireFee:a.type==='hr_train'?COURSES.find(c=>c.id===a.courseId)!.cost:0;}
function authorize(s:ManagedState,e:Employee,p:Decision,ops:Operations,explicit:boolean){
 const c=period(s,e),lim=c.limits,a=p.action;
 requireOk(e.hired&&!e.hr?.facilityId&&e.hr!.companyId==='retail-1','El gerente ya no está asignado a esta empresa.');
 requireOk(c.responsibilities.includes(responsibility(a)),'Esta tarea no está delegada al gerente.');
 requireOk(explicit||c.autonomy!=='manual','Este gerente necesita aprobación.');
 requireOk(p.risk<=lim.risk,'La propuesta supera el riesgo autorizado.');
 const cost=costOf(s,a,ops);requireOk(Number.isSafeInteger(cost)&&cost>=0,'Costo inválido.');
 requireOk(cost<=lim.perPurchase&&c.spentDay+cost<=lim.daily&&c.spentMonth+cost<=lim.monthly,'La operación supera el presupuesto por compra, diario o mensual.');
 requireOk(explicit||c.autonomy!=='supervised'||(cost<=lim.perPurchase*.5&&a.type!=='hire'&&a.type!=='hr_train'),'Compra importante o decisión de personal: necesita aprobación.');
 const reserve=Math.max(lim.reserve,observed(s).upcoming+(a.type==='hire'?(s.employees.find(e=>e.id===a.employeeId)?.salary||0):0));
 requireOk(cost===0||s.accounts.cash-cost>=reserve,'La compra dejaría la caja por debajo de la reserva o de las obligaciones próximas.');
 if(a.type==='hire')requireOk(c.hires<lim.hiringLimit,'Se alcanzó el límite mensual de contratación.');
 if(a.type==='buy_stock'){
  const o=observed(s,a.productId);requireOk(Number.isSafeInteger(a.quantity)&&a.quantity>0&&a.quantity<=o.warehouseFree,'Cantidad o capacidad de almacén inválida.');
  requireOk(o.stock+a.quantity<=Math.max(40,Math.ceil(o.dailyDemand*7)),'Sobreinventario: la compra supera siete días de demanda estimada.');
 }
 if(a.type==='set_price'){
  const ref=PRODUCTS.find(v=>v.id===a.productId)!,current=s.inventory.find(v=>v.productId===a.productId)!;
  requireOk(Number.isSafeInteger(a.price)&&a.price>0&&Math.abs(a.price/ref.suggested-1)*100<=lim.priceRange+.001,'Precio fuera del rango autorizado respecto al mercado.');
  requireOk(current.price!==a.price,'El precio recomendado ya está aplicado.');
 }
 return cost;
}
function execute(s:ManagedState,e:Employee,p:Decision,ops:Operations,explicit:boolean){
 requireOk(['pending','postponed','blocked'].includes(p.status),'Esta propuesta ya fue procesada.');requireOk(s.clock.second<p.expires,'La propuesta venció; solicita un análisis actualizado.');
 const cost=authorize(s,e,p,ops,explicit);p.justification+=explicit?' Aprobada tras validar los parámetros finales y los límites actuales.':'';if(p.action.type==='buy_stock')p.benefit=`Reposición de ${p.action.quantity} unidades; cobertura estimada ${((observed(s,p.action.productId).stock+p.action.quantity)/Math.max(1,observed(s,p.action.productId).dailyDemand)).toFixed(1)} días`;const before=s.accounts.cash,baseline=observed(s,'productId' in p.action?p.action.productId:undefined);
 if(p.action.type==='industry')throw new Error('Use el adaptador industrial.');ops.apply(p.action);const c=period(s,e);c.spentDay+=cost;c.spentMonth+=cost;if(p.action.type==='hire')c.hires++;
 p.status='executed';p.executedAt=s.clock.second;p.evaluateAt=s.clock.second+7*86400;p.cashChange=s.accounts.cash-before;p.cost=cost;p.baseline=baseline;p.reason=explicit?'Aprobada por el jugador':'Ejecutada dentro de los permisos';
 log(s,ops,'decision_executed',`${p.problem} · ${p.reason}`,e.id,cost,{action:p.action,before:baseline,after:observed(s),expected:p.benefit,cashChange:p.cashChange},p.id);
 notify(s,`done-${responsibility(p.action)}-${dayOf(s)}`,p.action.type==='buy_stock'?'Reposición ejecutada':'Decisión ejecutada',`${e.name}: ${p.benefit}. Consulta el resultado en el historial.`,p.action.type==='buy_stock'?'Inventario':'Gerencia','info');
}
function propose(s:ManagedState,e:Employee,ops:Operations,action:Action,problem:string,benefit:string,justification:string,risk:number,score:number){
 const key=action.type==='buy_stock'||action.type==='set_price'?`${action.type}-${action.productId}`:`${action.type}-${'employeeId' in action?action.employeeId:'industry'}`;
 const recent=s.management.decisions.some(p=>p.key===key&&((['pending','postponed','blocked'].includes(p.status)&&p.expires>s.clock.second)||(p.status==='executed'&&s.clock.second-(p.executedAt||0)<(action.type==='set_price'?7*86400:6*3600))||(p.status==='rejected'&&s.clock.second-p.second<86400)));
 if(recent)return;
 const data=observed(s,'productId' in action?action.productId:undefined),p:Decision={id:id(s,'decision'),managerId:e.id,companyId:'retail-1',second:s.clock.second,expires:s.clock.second+3*86400,wake:s.clock.second,key,problem,action,cost:costOf(s,action,ops),benefit,risk:clamp(risk),justification,score,data,status:'pending',reason:'Pendiente de autorización',executedAt:null,evaluateAt:null,actual:null,cashChange:0,baseline:null};
 s.management.decisions.push(p);log(s,ops,'decision_proposed',problem,e.id,0,{action,data,estimatedCost:p.cost,benefit,risk,justification},p.id);
 if(s.management.decisions.length>240){const removable=s.management.decisions.findIndex(v=>!['pending','postponed','blocked'].includes(v.status)&&(!v.evaluateAt||v.actual));if(removable>=0)s.management.decisions.splice(removable,1);}
 if(e.hr!.manager!.autonomy!=='manual'){try{execute(s,e,p,ops,false);}catch(error){p.reason=(error as Error).message;}}
 if(p.status==='pending')notify(s,`proposal-${key}`,problem,`${e.name}: ${p.reason}`,responsibility(action)==='purchases'?'Inventario':'Gerencia','important');
}
export function analyze(s:ManagedState,e:Employee,ops:Operations){
 requireOk(e.hired&&isManager(e)&&e.hr?.companyId==='retail-1','Asigna el gerente a la tienda antes de analizarla.');
 const c=period(s,e),o=observed(s),traits=e.hr!.traits,finance=skill(e,'finance')*managerFit(e,s,{industry:'retail'}),organization=skill(e,'organization')*managerFit(e,s,{industry:'retail'});
 if(c.responsibilities.includes('purchases')&&s.company.built){
  const shortage=PRODUCTS.map(p=>({p,o:observed(s,p.id)})).sort((a,b)=>a.o.stock/Math.max(1,a.o.dailyDemand)-b.o.stock/Math.max(1,b.o.dailyDemand));
  for(const {p,o} of shortage){
   const riskBias=(traits.includes('Arriesgado')?.8:traits.includes('Conservador')?-.35:0),target=Math.max(1.4,Math.min(6,2.5+(60-finance)/30+riskBias+c.learning+(traits.includes('Analítico')?-.15:0))),trigger=o.dailyDemand*(.65+organization/150+(traits.includes('Disciplinado')?.1:0));
   if(o.stock>trigger)continue;
   const unit=ops.purchaseCost(p.id),safeCash=Math.max(0,s.accounts.cash-Math.max(c.limits.reserve,o.upcoming)),quantity=Math.min(Math.ceil(o.dailyDemand*target-o.stock),o.warehouseFree,Math.floor(safeCash/unit));
   if(quantity<=0){notify(s,'liquidity','Reposición detenida por liquidez','La caja no cubre mercancía y obligaciones próximas. Revisa finanzas.','Finanzas','critical');continue;}
   propose(s,e,ops,{type:'buy_stock',productId:p.id,quantity},`Riesgo de desabastecimiento: ${p.name}`,`Cubrir aproximadamente ${((o.stock+quantity)/Math.max(1,o.dailyDemand)).toFixed(1)} días de demanda`,`${o.demandSource}. Existencias ${o.stock}, punto de reposición ${Math.ceil(trigger)}, costo unitario ${unit/100} USD, espacio ${o.warehouseFree}. Reserva protegida ${Math.max(c.limits.reserve,o.upcoming)/100} USD. Objetivo ${target.toFixed(1)} días según finanzas, personalidad y aprendizaje.`,15+(100-finance)/5+Math.max(0,target-3)*5,100-o.stock/Math.max(1,o.dailyDemand)*20);
  }
 }
 if(c.responsibilities.includes('prices')&&o.openMinutes>=240){
  for(const p of PRODUCTS){
   const v=observed(s,p.id),stock=s.inventory.find(i=>i.productId===p.id)!;if(stock.quantity===0)continue;
   let factor=1;
   if(c.strategy==='sales')factor=.95;
   else if(c.strategy==='competitive')factor=.98;
   else if(c.strategy==='liquidity')factor=v.stock>v.dailyDemand*2?.94:1;
   else if(c.strategy==='slow_stock')factor=v.stock>v.dailyDemand*4?.90:1;
   else if(c.strategy==='profit')factor=1.05;
   else factor=v.stock>v.dailyDemand*4?.96:v.lost>0?1.03:1;
   // A bounded skill-dependent judgment error can choose an inferior price. It is never booked as realized profit.
   const error=(noise(s.seed,`${e.id}-${dayOf(s)}-${p.id}`)-.5)*(100-skill(e,'commerce'))/2000;
   factor+=error+(traits.includes('Competitivo')?-.01:traits.includes('Innovador')?.01:0);
   const range=c.limits.priceRange/100,price=Math.round(Math.min(p.suggested*(1+range),Math.max(p.suggested*(1-range),p.suggested*factor)));
   if(Math.abs(price-stock.price)<Math.max(2,stock.price*.015))continue;
   const demandRatio=Math.max(0,2.2-1.2*price/p.suggested)/Math.max(.01,2.2-1.2*stock.price/p.suggested),forecast=Math.min(v.dailyDemand*demandRatio,v.capacity*14,stock.quantity),oldMargin=Math.min(v.dailyDemand,v.capacity*14,stock.quantity)*(stock.price-p.cost),newMargin=forecast*(price-p.cost);
   propose(s,e,ops,{type:'set_price',productId:p.id,price},`Revisar precio: ${p.name}`,`Cambio estimado del margen diario: ${((newMargin-oldMargin)/100).toFixed(2)} USD; no garantizado`,`Precio ${stock.price/100} → ${price/100} USD. Demanda ${v.dailyDemand.toFixed(1)}/día, capacidad ${v.capacity.toFixed(1)}/h, margen unitario ${(price-p.cost)/100} USD. Estrategia ${c.strategy}; puede fallar si cambia el mercado o se alcanza la capacidad.`,20+(100-skill(e,'commerce'))/5+(newMargin<oldMargin?10:0),50+(newMargin-oldMargin)/100);
  }
 }
 if(c.responsibilities.includes('hiring')&&s.employees.filter(e=>e.hired&&!e.hr?.facilityId).length<BALANCE.maxEmployees){
  const demand=PRODUCTS.reduce((n,p)=>n+observed(s,p.id).dailyDemand,0),need=!s.employees.some(v=>v.hired&&v.role==='cashier')||(o.openMinutes>=240&&demand>teamCapacity(s)*15);
  if(need){const worker=s.employees.filter(v=>available(v,s)&&v.role==='cashier').sort((a,b)=>skill(b,'productivity')/b.salary-skill(a,'productivity')/a.salary)[0];if(worker)propose(s,e,ops,{type:'hire',employeeId:worker.id},'Capacidad de atención insuficiente',`Añadir hasta ${(45*worker.attributes.productivity/100).toFixed(1)} atenciones/h antes de motivación y estrés`,`Demanda estimada ${Math.round(demand)}/día y capacidad ${o.capacity.toFixed(1)}/h. ${worker.name}: salario ${worker.salary/100} USD/mes, contratación ${BALANCE.hireFee/100} USD. La reserva incluye la nueva nómina.`,30,70);}
 }
 if(c.responsibilities.includes('training')){const worker=s.employees.filter(v=>v.hired&&!v.hr?.facilityId&&!v.hr!.training&&v.attributes.productivity<75).sort((a,b)=>a.attributes.productivity-b.attributes.productivity)[0];if(worker)propose(s,e,ops,{type:'hr_train',employeeId:worker.id,courseId:'operations'},`Capacitación recomendada: ${worker.name}`,'Mejorar productividad con rendimiento decreciente',`Productividad ${worker.attributes.productivity}/100; aprendizaje ${skill(worker,'learning')}/100. Durante 4 días, capacidad individual −15%. El resultado puede ser inferior al esperado.`,20,45);}
 if(c.responsibilities.includes('finance')&&(o.profit<0||o.cash<o.upcoming)){
 const buyer=s.employees.find(v=>v.hired&&v.hr?.companyId==='retail-1'&&v.hr.manager?.responsibilities.includes('purchases')&&v.hr.manager.limits.reserve<o.upcoming+BALANCE.dailyOperating*7);
 if(buyer)propose(s,e,ops,{type:'hr_control_costs',employeeId:buyer.id,reserve:o.upcoming+BALANCE.dailyOperating*7},'Proteger liquidez limitando reposiciones',`Elevar la reserva de compras a ${(o.upcoming+BALANCE.dailyOperating*7)/100} USD; puede aumentar el riesgo de faltantes`,`Utilidad observada ${o.profit/100} USD; nómina ${o.payroll/100}, obligaciones y gastos próximos ${o.upcoming/100}. La política restringe compras futuras de ${buyer.name}; no registra ahorros ficticios ni transfiere dinero.`,20,80);
 }
 if(c.responsibilities.includes('finance')&&(o.profit<0||o.cash<o.upcoming))notify(s,'finance-review','Revisión financiera necesaria',`Resultado de hasta 7 días: ${(o.profit/100).toFixed(2)} USD. Caja ${(o.cash/100).toFixed(2)}; obligaciones y reserva operativa ${(o.upcoming/100).toFixed(2)}. Recomendación: limitar compras de baja rotación y revisar nómina. No se ha ejecutado una reducción de gastos.`, 'Finanzas',o.cash<o.upcoming?'critical':'important',3*86400);
}
function incident(s:ManagedState,ops:Operations,e:Employee|null,kind:HRIncident['kind'],title:string,cause:string,cost=0){
 if(e&&kind!=='resignation'&&dayOf(s)-e.hr!.lastEventDay<10)return;
 if(e)e.hr!.lastEventDay=dayOf(s);
 const ev:HRIncident={id:id(s,'hr-event'),employeeId:e?.id||null,second:s.clock.second,kind,title,cause,cost,resolved:kind==='resignation',outcome:kind==='resignation'?'Renuncia procesada':'',expires:s.clock.second+7*86400};s.management.incidents.push(ev);if(s.management.incidents.length>80)s.management.incidents.shift();
 log(s,ops,'personnel_event',`${title}: ${cause}`,e?.id||null,0,{kind});notify(s,`hr-${e?.id||kind}-${kind}`,title,cause,kind==='exceptional'?'Oportunidades':'Personal',kind==='resignation'?'critical':'important');
}
function completeTraining(s:ManagedState,ops:Operations){for(const e of s.employees.filter(v=>v.hired)){const hr=e.hr!;
  if(hr.training&&s.clock.second>=hr.training.ends){const course=COURSES.find(c=>c.id===hr.training!.courseId)!,before=skill(e,course.skill),roll=noise(s.seed,`${e.id}-${hr.training.started}`),gain=Math.max(1,Math.round(hr.training.expected*(roll<.18?.4:1)));e.attributes[course.skill]=clamp(before+gain);hr.training=null;e.attributes.motivation=clamp(e.attributes.motivation+4);log(s,ops,'training_completed',`${course.name}: ${before} → ${skill(e,course.skill)}${roll<.18?' (resultado inferior al esperado)':''}`,e.id,0,{gain});notify(s,`trained-${e.id}-${dayOf(s)}`,'Capacitación finalizada',`${e.name}: ${course.name} +${gain}.`,'Personal');}
}}
function dailyPeople(s:ManagedState,ops:Operations){
 const supervisors=s.employees.filter(e=>e.hired&&!e.hr?.facilityId&&e.hr!.companyId==='retail-1'&&(isManager(e)||e.role==='supervisor')),lead=supervisors.length?supervisors.reduce((n,e)=>n+e.attributes.leadership,0)/supervisors.length:40;
 const yesterday=s.history.find(h=>h.day===dayOf(s)-1),workload=yesterday?yesterday.units/Math.max(1,teamCapacity(s)*14):0;
 for(const e of s.employees.filter(v=>v.hired&&!v.hr?.facilityId&&assignedId(v)!=='holding')){
  const hr=e.hr!;

  const paid=e.salary/hr.expectedSalary,arrears=(e.arrears||0)>0,stressDelta=workload>.85?2:workload<.5?-2:0;
  e.attributes.stress=clamp(e.attributes.stress+stressDelta+(arrears?3:0)-(skill(e,'stressResistance')>70?1:0));
  const causes:string[]=[];if(paid<.95)causes.push('Salario inferior a su expectativa');if(arrears)causes.push('Salarios vencidos sin pagar');if(e.attributes.stress>65)causes.push('Estrés sostenido por carga laboral');if(lead<40)causes.push('Supervisión insuficiente');
  hr.causes=causes;const delta=staffEffects(s,context(s,'retail-main')).morale*3+(paid<.95?-2:paid>1.1?1:0)+(arrears?-5:0)+(e.attributes.stress>65?-2:0)+(lead>75?1:lead<40?-1:0)+(supervisors.some(v=>v.hr!.traits.includes('Sociable'))&&e.attributes.motivation<80?1:0)+(hr.training?1:0);
  e.attributes.motivation=clamp(e.attributes.motivation+delta);hr.unhappyDays=e.attributes.motivation<25?hr.unhappyDays+1:0;
  if(yesterday?.openMinutes){hr.xp+=Math.round(yesterday.openMinutes/60);hr.level=Math.min(10,1+Math.floor(hr.xp/750));e.attributes.experience=clamp(hr.xp/60);if(dayOf(s)%30===0)e.attributes.productivity=clamp(e.attributes.productivity+(e.attributes.productivity<90&&skill(e,'learning')>40?1:0));}
  const patience=hr.traits.includes('Leal')?7:hr.traits.includes('Ambicioso')?3:5;
  if(hr.unhappyDays>=patience&&causes.length){ops.quit(e);incident(s,ops,e,'resignation',`${e.name} renunció`,`${causes.join('; ')}. ${hr.unhappyDays} días con motivación inferior a 25. Los salarios devengados pendientes siguen registrados.`);continue;}
  if(arrears||paid<.95)incident(s,ops,e,'raise',`${e.name} solicita revisión salarial`,causes.join('; ')||'Expectativa salarial',Math.ceil(e.salary*.1));
  else if(e.attributes.stress>75&&s.employees.filter(v=>v.hired).length>1)incident(s,ops,e,'conflict','Conflicto en el equipo',`${e.name}: estrés ${e.attributes.stress}/100 por carga laboral. Mediación y reconocimiento: 50 USD.`,5000);
  else if(e.attributes.motivation<45)incident(s,ops,e,'motivation','Caída de motivación',`${e.name}: ${causes.join('; ')||'Motivación baja sostenida'}. Reconocimiento: 25 USD.`,2500);
  else if(hr.level>=3&&!isManager(e)&&hr.traits.includes('Ambicioso'))incident(s,ops,e,'promotion','Solicitud de ascenso',`${e.name} alcanzó nivel ${hr.level}. Aceptar lo promueve a supervisor con 20% de aumento salarial.`,Math.ceil(e.salary*.2));
  else if(isManager(e)&&skill(e,'leadership')>75&&dayOf(s)%30===0)incident(s,ops,e,'offer','Oferta de otra empresa',`${e.name}: liderazgo ${e.attributes.leadership}/100 y perfil competitivo. Retener con 10% de aumento o permitir que valore su permanencia.`,Math.ceil(e.salary*.1));
  else if(dayOf(s)%28===0&&e.attributes.productivity>75)incident(s,ops,e,'recognition','Reconocimiento por desempeño',`${e.name} mantuvo productividad ${e.attributes.productivity}/100. Bono de 30 USD: motivación +8.`,3000);
 }
 if(dayOf(s)%14===0){const e=s.employees.find(v=>v.hired&&!v.hr!.training);if(e)incident(s,ops,e,'training','Oportunidad de capacitación',`${e.name} puede completar Organización en tres días.`,8000);}
 if(dayOf(s)%21===0){const e=s.employees.find(v=>v.hired&&isManager(v));if(e)incident(s,ops,e,'reorganize','Propuesta de reorganización',`Revisar cuellos de botella y generar propuestas actualizadas para ${s.company.name}.`);}
 const exceptional=s.employees.find(e=>available(e,s)&&skill(e,'finance')>=85&&skill(e,'productivity')>=85);if(exceptional)notify(s,`exceptional-${exceptional.id}`,'Candidato excepcional disponible',`${exceptional.name}; salario esperado ${exceptional.salary/100} USD. Disponible hasta el día ${exceptional.hr!.expires+1}.`,'Oportunidades','important',30*86400);
}
function evaluate(s:ManagedState,ops:Operations){
 for(const p of s.management.decisions.filter(v=>v.action.type!=='industry'&&v.status==='executed'&&v.evaluateAt&&v.evaluateAt<=s.clock.second&&!v.actual)){
  const before=p.baseline!,o=observed(s,'productId' in p.action?p.action.productId:undefined),e=s.employees.find(e=>e.id===p.managerId);
  p.actual=`Observado en hasta 7 días: ventas ${o.units}, utilidad ${(o.profit/100).toFixed(2)} USD, faltantes ${o.lost}. Antes: ${before.units} ventas, ${(before.profit/100).toFixed(2)} USD, ${before.lost} faltantes. Reputación ${before.reputation} → ${o.reputation}. Comparación observacional; incluye otras decisiones y cambios de mercado.`;
  if(e?.hr?.manager){const improvement=(o.profit/Math.max(1,o.openMinutes)-before.profit/Math.max(1,before.openMinutes));e.hr.manager.learning=Math.max(-.4,Math.min(.4,e.hr.manager.learning+(p.action.type==='buy_stock'?(o.lost>before.lost?.03:o.stock>o.dailyDemand*4?-.04:0):(improvement>0?.01:-.01))));}
  log(s,ops,'decision_evaluated',p.actual,p.managerId,0,{before,after:o},p.id);
 }
 if(dayOf(s)%7!==0)return;
 for(const e of s.employees.filter(v=>v.hired&&isManager(v)&&v.hr!.companyId==='retail-1'&&!v.hr!.facilityId&&assignedId(v)!=='holding')){
  const o=observed(s),c=period(s,e),efficiency=o.units/Math.max(1,o.openMinutes/60*o.capacity),budget=c.spentMonth<=c.limits.monthly?100:0,turnover=o.units/Math.max(1,s.inventory.reduce((n,i)=>n+i.quantity,0)),lostRate=o.lost/Math.max(1,o.units+o.lost),team=s.employees.filter(v=>v.hired),productivity=team.reduce((n,e)=>n+e.attributes.productivity,0)/Math.max(1,team.length);
  const score=clamp(20*Math.min(1,efficiency)+budget*.15+Math.min(20,turnover*5)+20*(1-lostRate)+o.satisfaction*.15+productivity*.1);
  s.management.evaluations.push({id:id(s,'evaluation'),managerId:e.id,day:dayOf(s),score,indicators:{profit:o.profit,efficiency:Math.round(efficiency*100),budget,turnover:Math.round(turnover*100)/100,lost:o.lost,productivity:Math.round(productivity),satisfaction:Math.round(o.satisfaction)},context:`${Math.round(o.openMinutes/60)} h de operación; capacidad ${o.capacity.toFixed(1)}/h, reputación ${o.reputation}, caja ${o.cash/100} USD. Indicadores compartidos del negocio, sin atribuir toda la utilidad al gerente.`});
  log(s,ops,'evaluation',`Evaluación semanal ${score}/100`,e.id,0,s.management.evaluations.at(-1));
 }
 s.management.evaluations=s.management.evaluations.slice(-100);
}
export function managementHour(s:ManagedState,ops:Operations,newDay:boolean){
 completeTraining(s,ops);
 if(newDay){refreshMarket(s);dailyPeople(s,ops);evaluate(s,ops);}
 for(const p of s.management.decisions){if(['pending','blocked','postponed'].includes(p.status)&&s.clock.second>=p.expires){p.status='expired';p.reason='Datos vencidos';log(s,ops,'decision_expired',p.problem,p.managerId,0,undefined,p.id);}else if(p.status==='postponed'&&p.wake<=s.clock.second)p.status='pending';}
 // Decisions every six simulated hours; bounded work independent of minute-level sales.
 if(Math.floor(s.clock.second/3600)%6!==0)return;
 for(const e of s.employees.filter(v=>v.hired&&isManager(v)&&v.hr!.companyId==='retail-1'&&!v.hr!.facilityId&&assignedId(v)!=='holding')){
  for(const p of s.management.decisions.filter(v=>v.managerId===e.id&&v.status==='pending'&&v.wake<=s.clock.second))if(e.hr!.manager!.autonomy!=='manual'){try{execute(s,e,p,ops,false);}catch(error){p.reason=(error as Error).message;}}
  analyze(s,e,ops);
 }
}
export function recordDemand(s:ManagedState,productId:string,sold:number,lost:number){let row=s.management.dailySales.at(-1);if(!row||row.day!==dayOf(s)){row={day:dayOf(s),units:{},lost:{},openMinutes:0};s.management.dailySales.push(row);if(s.management.dailySales.length>8)s.management.dailySales.shift();}row.units[productId]=(row.units[productId]||0)+sold;row.lost[productId]=(row.lost[productId]||0)+lost;}
export function makeReport(s:ManagedState,e:Employee){
 const facts=observed(s),mine=s.management.decisions.filter(p=>p.managerId===e.id),low=PRODUCTS.filter(p=>observed(s,p.id).stock<observed(s,p.id).dailyDemand);
 return {id:id(s,'manager-report'),managerId:e.id,second:s.clock.second,companyName:s.company.name,facts,problems:[...low.map(p=>`Cobertura menor a un día: ${p.name}`),...(facts.profit<0?['Resultado negativo en el período observado']:[]),...s.employees.filter(v=>v.hired&&v.attributes.motivation<45).map(e=>`${e.name}: ${e.hr!.causes.join('; ')||'motivación baja'}`)],actions:mine.filter(p=>p.status==='executed').slice(-8).map(p=>`${p.problem}: ejecutada el día ${Math.floor(p.executedAt!/86400)+1}; costo ${p.cost/100} USD`),results:mine.filter(p=>p.actual).slice(-5).map(p=>p.actual!),recommendations:mine.filter(p=>['pending','postponed','blocked'].includes(p.status)).map(p=>`${p.problem}: PROPUESTA, sin ejecutar. ${p.justification}`),risks:[`Nómina mensual ${facts.payroll/100} USD; obligaciones/reserva operativa ${facts.upcoming/100} USD.`,...(facts.cash<facts.upcoming?['Caja inferior a obligaciones próximas.']:[]),'Las estimaciones dependen de demanda, personal, precios e inventario; no garantizan utilidad.']};
}
export function managementCommand(s:ManagedState,c:Command,ops:Operations):boolean {
 if(!c.type.startsWith('hr_'))return false;
 const cmd=c as ManagementCommand,e='employeeId' in cmd?s.employees.find(v=>v.id===cmd.employeeId):undefined;
 if('employeeId' in cmd)requireOk(e,'Empleado no encontrado.');
 switch(cmd.type){
  case 'hr_control_costs':requireOk(e!.hired&&e!.hr?.manager&&e!.hr!.companyId==='retail-1','Gerente de compras no disponible.');requireOk(Number.isSafeInteger(cmd.reserve)&&cmd.reserve>=e!.hr!.manager!.limits.reserve&&cmd.reserve<=100000000,'La nueva reserva solo puede aumentar dentro de los límites.');e!.hr!.manager!.limits.reserve=cmd.reserve;e!.hr!.manager!.strategy='liquidity';log(s,ops,'liquidity_policy',`Reserva de compras elevada a ${cmd.reserve/100} USD; estrategia de liquidez`,e!.id);break;
  case 'hr_candidate':requireOk(!e!.hired,'Ya forma parte del equipo.');if(cmd.action==='favorite')e!.hr!.favorite=!e!.hr!.favorite;else e!.hr!.rejected=true;break;
  case 'hr_assign':requireOk(e!.hired&&isManager(e!),'Selecciona un gerente contratado.');requireOk(!cmd.companyId||s.company.built,'Construye la tienda.');e!.hr!.companyId=cmd.companyId;log(s,ops,'assignment',cmd.companyId?'Gerente asignado a la tienda':'Gerente desasignado',e!.id);break;
  case 'hr_configure':{
   requireOk(e!.hired&&isManager(e!),'Selecciona un gerente contratado.');const lim=cmd.limits;
   requireOk(['manual','supervised','autonomous'].includes(cmd.autonomy),'Autonomía inválida.');requireOk(cmd.responsibilities.every(r=>['purchases','prices','hiring','training','finance','production','transport','maintenance','investment'].includes(r)),'Responsabilidades inválidas.');
   for(const [key,value] of Object.entries(lim))requireOk(Number.isSafeInteger(value)&&value>=0&&value<=100000000,`Límite inválido: ${key}`);
   requireOk(lim.hiringLimit<=8&&lim.priceRange<=30&&lim.risk<=100,'Rango de permisos inválido.');
   Object.assign(e!.hr!.manager!,{autonomy:cmd.autonomy,responsibilities:[...new Set(cmd.responsibilities)],limits:lim,strategy:cmd.strategy});log(s,ops,'permissions','Permisos y estrategia actualizados',e!.id,0,{autonomy:cmd.autonomy,responsibilities:cmd.responsibilities,limits:lim,strategy:cmd.strategy});break;
  }
  case 'hr_analyze':analyze(s,e!,ops);break;
  case 'hr_decide':{
   const p=s.management.decisions.find(v=>v.id===cmd.decisionId);requireOk(p&&['pending','postponed','blocked'].includes(p.status)&&p.expires>s.clock.second,'La propuesta ya fue procesada o venció.');
   if(cmd.choice==='reject'){p!.status='rejected';p!.reason='Rechazada por el jugador';log(s,ops,'decision_rejected',p!.problem,p!.managerId,0,undefined,p!.id);}
   else if(cmd.choice==='postpone'){p!.status='postponed';p!.wake=Math.min(p!.expires,s.clock.second+86400);p!.reason='Pospuesta un día';log(s,ops,'decision_postponed',p!.problem,p!.managerId,0,undefined,p!.id);}
   else{if(cmd.quantity!==undefined){requireOk(p!.action.type==='buy_stock','No admite cantidad.');(p!.action as {quantity:number}).quantity=cmd.quantity;}if(cmd.price!==undefined){requireOk(p!.action.type==='set_price','No admite precio.');(p!.action as {price:number}).price=cmd.price;}const manager=s.employees.find(e=>e.id===p!.managerId);requireOk(manager,'Gerente no disponible.');execute(s,manager!,p!,ops,true);}break;
  }
  case 'hr_train':{
   const course=COURSES.find(v=>v.id===cmd.courseId);requireOk(e!.hired&&course,'Curso o empleado no disponible.');requireOk(!e!.hr!.training,'Ya tiene una capacitación en curso.');requireOk(e!.hr!.level>=course!.level,`Se requiere nivel ${course!.level}.`);requireOk(s.accounts.cash>=course!.cost,'No hay efectivo suficiente.');
   const before=skill(e!,course!.skill);requireOk(before<98,'Este atributo ya está cerca de su límite.');const expected=Math.max(1,Math.round((100-before)*(.06+skill(e!,'learning')/1000)));
   ops.expense(course!.cost,`Capacitación: ${course!.name}`,e!.id);e!.hr!.training={courseId:course!.id,started:s.clock.second,ends:s.clock.second+course!.days*86400,before,expected};log(s,ops,'training_started',`${course!.name}: ${course!.days} días; mejora estimada +${expected}`,e!.id,course!.cost);break;
  }
  case 'hr_promote':{
   requireOk(e!.hired&&e!.hr!.level>=3,'Se requiere nivel 3 y contratación activa.');requireOk(cmd.role==='supervisor'||MANAGER_ROLES.includes(cmd.role),'Cargo no válido.');requireOk(e!.role!==cmd.role,'Ya ocupa ese puesto.');requireOk(e!.attributes.leadership>=55,'Se requiere liderazgo 55.');const salary=Math.ceil(e!.salary*1.2);requireOk(s.accounts.cash>=payroll(s)-e!.salary+salary,'Reserva insuficiente para la nueva nómina.');e!.role=cmd.role;e!.salary=salary;e!.hr!.expectedSalary=salary;e!.hr!.manager=isManager(e!)?defaultConfig(e!.role,s):null;e!.attributes.motivation=clamp(e!.attributes.motivation+8);if(!s.employees.some(v=>v.hired&&v.role==='cashier'))s.company.open=false;log(s,ops,'promotion',`Ascenso a ${cmd.role}; salario ${salary/100} USD/mes`,e!.id);break;
  }
  case 'hr_report':requireOk(e!.hired&&isManager(e!),'Selecciona un gerente contratado.');s.management.reports.push(makeReport(s,e!));s.management.reports=s.management.reports.slice(-40);log(s,ops,'report','Informe gerencial solicitado',e!.id);break;
  case 'hr_event':{
   const ev=s.management.incidents.find(v=>v.id===cmd.eventId);requireOk(ev&&!ev.resolved&&ev.expires>s.clock.second,'Evento finalizado.');const worker=s.employees.find(v=>v.id===ev!.employeeId);requireOk(worker?.hired,'Empleado no disponible.');
   if(cmd.choice==='accept'){
    if(ev!.kind==='raise'||ev!.kind==='offer'){requireOk(s.accounts.cash>=payroll(s)+ev!.cost,'Reserva de nómina insuficiente.');worker!.salary+=ev!.cost;worker!.attributes.motivation=clamp(worker!.attributes.motivation+10);}
    else if(ev!.kind==='promotion'){ops.apply({type:'hr_promote',employeeId:worker!.id,role:'supervisor'});}
    else if(ev!.kind==='training'){ops.apply({type:'hr_train',employeeId:worker!.id,courseId:'organization'});}
    else if(ev!.kind==='reorganize'){analyze(s,worker!,ops);}
    else{requireOk(s.accounts.cash>=ev!.cost,'Efectivo insuficiente.');ops.expense(ev!.cost,ev!.title,ev!.id);worker!.attributes.motivation=clamp(worker!.attributes.motivation+8);worker!.attributes.stress=clamp(worker!.attributes.stress-10);}
   }else worker!.attributes.motivation=clamp(worker!.attributes.motivation-(ev!.kind==='offer'?12:4));
   ev!.resolved=true;ev!.outcome=cmd.choice==='accept'?'Aceptado':'Rechazado';log(s,ops,'personnel_resolved',`${ev!.title}: ${ev!.outcome}`,worker!.id,cmd.choice==='accept'&&!['raise','offer','promotion','training','reorganize'].includes(ev!.kind)?ev!.cost:0);break;
  }
  case 'hr_read_notices':for(const n of s.management.notifications)n.read=true;break;
 }
 return true;
}
