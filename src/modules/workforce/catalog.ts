import type {Role} from '../simulation/types';
import type {Responsibility,Skill} from '../management/types';
import type {Sector} from './types';
export type Effect='service'|'sales'|'stock'|'quality'|'maintenance'|'production'|'waste'|'routing'|'planning'|'morale'|'finance';
export interface Position {id:string;name:string;sector:Sector;department:string;role:Role;rank:number;baseSalary:number;skill:Skill;effects:Partial<Record<Effect,number>>;permissions:Responsibility[];track:string;variants?:string[]}
export const SECTORS:Record<Sector,string>={retail:'Supermercados y comercio',restaurant:'Restaurantes',hotel:'Hotelería',fuel:'Gasolineras',factory:'Manufactura',logistics:'Logística y transporte',banking:'Banca propia · futura',holding:'Holding corporativo'};
export const DEPARTMENTS:Record<string,string>={direction:'Dirección general',checkout:'Cajas',sales:'Ventas',stock:'Inventario y almacén',service:'Atención al cliente',cleaning:'Limpieza',operations:'Operaciones',kitchen:'Cocina',dining:'Servicio y bebidas',purchasing:'Compras y abastecimiento',reception:'Recepción y reservas',rooms:'Habitaciones',maintenance:'Mantenimiento',security:'Seguridad',guest:'Atención al huésped',revenue:'Ingresos y tarifas',pumps:'Surtidores',production:'Producción',quality:'Calidad',planning:'Planificación',transport:'Transporte',fleet:'Flota',dispatch:'Despacho y entregas',administration:'Administración',finance:'Finanzas',credit:'Crédito',risk:'Riesgos',audit:'Auditoría',people:'Recursos humanos',investment:'Inversiones',strategy:'Estrategia'};
const positions:Position[]=[];
function p(sector:Sector,key:string,name:string,department:string,role:Role,rank:number,salary:number,skill:Skill,effects:Position['effects'],permissions:Responsibility[]=[],track=department,variants?:string[]){positions.push({id:`${sector}_${key}`,name,sector,department,role,rank,baseSalary:salary*100,skill,effects,permissions,track,variants});}
p('retail','cashier','Cajero','checkout','cashier',1,420,'productivity',{service:.08},[],'store');
p('retail','stocker','Reponedor','stock','stocker',1,390,'organization',{stock:.18});
p('retail','seller','Vendedor','sales','salesperson',1,420,'commerce',{sales:.15});
p('retail','inventory','Encargado de inventario','stock','specialist',2,560,'organization',{stock:.2,waste:.12});
p('retail','cleaner','Personal de limpieza','cleaning','specialist',1,350,'organization',{quality:.08,morale:.06});
p('retail','service','Atención al cliente','service','specialist',1,430,'commerce',{service:.12,sales:.08});
p('retail','supervisor','Supervisor','operations','supervisor',2,620,'leadership',{service:.1,morale:.12},[],'store');
p('retail','chief','Jefe de tienda','direction','supervisor',3,800,'organization',{planning:.15,morale:.12},[],'store');
p('retail','manager','Gerente de supermercado','direction','general_manager',4,950,'leadership',{planning:.12,morale:.08},['purchases','prices','hiring','training','finance'],'store');
p('retail','commercial','Gerente comercial','sales','commercial_manager',4,850,'commerce',{sales:.15},['prices']);
p('retail','stock_manager','Gerente de inventario','stock','inventory_manager',4,850,'organization',{stock:.2,waste:.2},['purchases']);
p('retail','operations','Gerente de operaciones','operations','operations_manager',4,900,'organization',{service:.12,planning:.12},['hiring','training','maintenance']);
// Existing financial and HR managers retain a useful retail role and their historical permissions.
p('retail','finance','Gerente financiero','finance','finance_manager',4,980,'finance',{finance:.18},['finance']);
p('retail','hr','Gerente de recursos humanos','people','hr_manager',4,880,'leadership',{morale:.2},['hiring','training']);
p('restaurant','chef','Chef ejecutivo','kitchen','cook',3,900,'creativity',{quality:.3,production:.2,waste:.2},[],'kitchen');
p('restaurant','cook','Cocinero','kitchen','cook',1,480,'productivity',{production:.1},[],'kitchen');
p('restaurant','assistant','Ayudante de cocina','kitchen','specialist',1,350,'organization',{production:.14,waste:.1},[],'kitchen');
p('restaurant','waiter','Mesero','dining','waiter',1,400,'commerce',{service:.18,quality:.08});
p('restaurant','cashier','Cajero','checkout','cashier',1,400,'organization',{service:.06});
p('restaurant','bartender','Bartender','dining','specialist',2,550,'creativity',{quality:.18,sales:.12},[], 'dining',['casual','premium']);
p('restaurant','cleaner','Personal de limpieza','cleaning','specialist',1,340,'organization',{quality:.1,waste:.08});
p('restaurant','buyer','Encargado de compras','purchasing','specialist',2,580,'negotiation',{stock:.15,waste:.18});
p('restaurant','supervisor','Supervisor de restaurante','operations','supervisor',2,620,'leadership',{service:.15,morale:.12},[],'kitchen');
p('restaurant','manager','Gerente de restaurante','direction','restaurant_manager',4,950,'leadership',{planning:.12,morale:.1},['purchases','prices','hiring','maintenance'],'kitchen');
p('restaurant','gastronomic','Gerente gastronómico','kitchen','restaurant_manager',4,1080,'creativity',{quality:.2,waste:.2},['purchases','prices','hiring']);
p('restaurant','operations','Gerente de operaciones','operations','operations_manager',4,900,'organization',{service:.18},['hiring','maintenance']);
p('restaurant','purchasing','Gerente de compras','purchasing','inventory_manager',4,860,'negotiation',{waste:.22,stock:.16},['purchases']);
p('hotel','receptionist','Recepcionista','reception','receptionist',1,490,'organization',{service:.1},[],'reception');
p('hotel','housekeeper','Camarera de habitaciones','rooms','housekeeper',1,410,'productivity',{quality:.12},[],'rooms');
p('hotel','cleaner','Personal de limpieza','cleaning','specialist',1,370,'organization',{quality:.1,morale:.05});
p('hotel','technician','Técnico de mantenimiento','maintenance','specialist',2,650,'productivity',{maintenance:.3});
p('hotel','security','Personal de seguridad','security','specialist',1,480,'honesty',{quality:.1,morale:.1});
p('hotel','concierge','Conserje','guest','specialist',2,560,'commerce',{sales:.15,service:.12});
p('hotel','reservations','Encargado de reservas','reception','specialist',2,600,'organization',{planning:.2,sales:.12},[],'reception');
p('hotel','guest','Atención al huésped','guest','specialist',1,480,'commerce',{service:.2,quality:.12});
p('hotel','supervisor','Supervisor de hotel','operations','supervisor',2,720,'leadership',{morale:.15,planning:.1},[],'hotel');
p('hotel','manager','Gerente general de hotel','direction','hotel_manager',4,1250,'leadership',{planning:.16,morale:.12},['prices','purchases','maintenance','hiring'],'hotel');
p('hotel','reception_manager','Gerente de recepción','reception','hotel_manager',4,980,'organization',{service:.2,planning:.15},['hiring'],'reception');
p('hotel','rooms_manager','Gerente de habitaciones','rooms','hotel_manager',4,1000,'organization',{quality:.2,production:.1},['purchases','hiring'],'rooms');
p('hotel','maintenance_manager','Gerente de mantenimiento','maintenance','hotel_manager',4,1100,'productivity',{maintenance:.3},['maintenance']);
p('hotel','revenue_manager','Gerente de ingresos hoteleros','revenue','hotel_manager',4,1180,'finance',{sales:.18},['prices','finance']);
p('fuel','attendant','Despachador de combustible','pumps','attendant',1,460,'productivity',{service:.08},[],'station');
p('fuel','cashier','Cajero','checkout','cashier',1,420,'organization',{service:.15});
p('fuel','inventory','Encargado de inventario','stock','specialist',2,600,'organization',{stock:.2});
p('fuel','technician','Técnico de mantenimiento','maintenance','specialist',2,700,'productivity',{maintenance:.35});
p('fuel','cleaner','Personal de limpieza','cleaning','specialist',1,350,'organization',{quality:.1});
p('fuel','supervisor','Supervisor de estación','operations','supervisor',2,680,'leadership',{service:.18,morale:.1},[],'station');
p('fuel','manager','Gerente de estación','direction','fuel_manager',4,1050,'leadership',{planning:.12},['purchases','prices','hiring','maintenance'],'station');
p('fuel','fuels','Gerente de combustibles','stock','fuel_manager',4,1000,'finance',{stock:.2},['purchases','prices']);
p('fuel','operations','Gerente de operaciones','operations','operations_manager',4,980,'organization',{service:.2,maintenance:.12},['hiring','maintenance']);
p('factory','operator','Operario de producción','production','operator',1,500,'productivity',{production:.05},[],'plant');
p('factory','technician','Técnico industrial','production','specialist',2,700,'organization',{production:.2,maintenance:.15},[],'plant');
p('factory','mechanic','Mecánico de maquinaria','maintenance','specialist',2,720,'productivity',{maintenance:.35});
p('factory','quality','Encargado de calidad','quality','specialist',2,680,'organization',{quality:.25,waste:.35});
p('factory','warehouse','Encargado de almacén','stock','specialist',2,570,'organization',{stock:.25});
p('factory','supervisor','Supervisor de producción','production','supervisor',2,780,'leadership',{production:.18,morale:.1},[],'plant');
p('factory','chief','Jefe de producción','production','supervisor',3,950,'organization',{production:.22,planning:.2},[],'plant');
p('factory','maintenance','Personal de mantenimiento','maintenance','specialist',1,510,'productivity',{maintenance:.22});
p('factory','planner','Planificador de producción','planning','specialist',2,760,'organization',{planning:.3,production:.12});
p('factory','manager','Gerente de planta','direction','industrial_manager',4,1200,'leadership',{planning:.16},['purchases','production','maintenance','investment','hiring'],'plant');
p('factory','production_manager','Gerente de producción','production','industrial_manager',4,1100,'organization',{production:.22,planning:.2},['production','hiring']);
p('factory','quality_manager','Gerente de calidad','quality','industrial_manager',4,1080,'organization',{quality:.3,waste:.4},['production','maintenance']);
p('factory','maintenance_manager','Gerente de mantenimiento','maintenance','industrial_manager',4,1150,'productivity',{maintenance:.4},['maintenance','investment']);
p('factory','supply_manager','Gerente de abastecimiento','purchasing','industrial_manager',4,1030,'negotiation',{stock:.25},['purchases']);
p('logistics','driver','Conductor','transport','driver',1,550,'productivity',{routing:.05},[],'transport');
p('logistics','warehouse','Operador de almacén','stock','specialist',1,460,'organization',{stock:.2,routing:.06},[],'warehouse');
p('logistics','dispatcher','Despachador','dispatch','specialist',2,600,'organization',{routing:.2},[],'transport');
p('logistics','planner','Planificador de rutas','planning','specialist',2,730,'organization',{routing:.3,planning:.2});
p('logistics','mechanic','Mecánico','maintenance','specialist',2,720,'productivity',{maintenance:.4});
p('logistics','coordinator','Coordinador de entregas','dispatch','specialist',2,700,'organization',{routing:.2,service:.12},[],'transport');
p('logistics','supervisor','Supervisor de flota','fleet','supervisor',3,850,'leadership',{maintenance:.2,routing:.15},[],'transport');
p('logistics','admin','Personal administrativo','administration','specialist',1,470,'organization',{planning:.2,finance:.1});
p('logistics','manager','Gerente de logística','direction','logistics_manager',4,1150,'leadership',{planning:.15},['transport','maintenance','investment','hiring'],'transport');
p('logistics','transport_manager','Gerente de transporte','transport','logistics_manager',4,1070,'organization',{routing:.25},['transport','hiring'],'transport');
p('logistics','fleet_manager','Gerente de flota','fleet','logistics_manager',4,1120,'productivity',{maintenance:.3},['maintenance','investment']);
p('logistics','warehouse_manager','Gerente de almacén','stock','inventory_manager',4,970,'organization',{stock:.3,routing:.1},['transport','purchases'],'warehouse');
p('logistics','operations','Gerente de operaciones','operations','operations_manager',4,1050,'organization',{routing:.2,planning:.2},['transport','hiring','maintenance']);
for(const [key,name,dep,sk] of [['teller','Cajero bancario','checkout','organization'],['account','Ejecutivo de cuenta','service','commerce'],['credit','Analista de crédito','credit','finance'],['finance','Analista financiero','finance','finance'],['sales','Asesor comercial','sales','commerce'],['risk','Analista de riesgo','risk','finance'],['service','Atención al cliente','service','commerce'],['auditor','Auditor interno','audit','honesty']] as const)p('banking',key,name,dep,'specialist',2,780,sk,{});
for(const [key,name,dep] of [['manager','Gerente bancario','direction'],['credit_manager','Gerente de crédito','credit'],['risk_manager','Gerente de riesgos','risk'],['finance_manager','Gerente financiero','finance'],['commercial_manager','Gerente comercial','sales']] as const)p('banking',key,name,dep,'finance_manager',4,1500,'finance',{},['finance']);
for(const [key,name,dep,sk,ef] of [['accountant','Contador corporativo','finance','finance','finance'],['financial','Analista financiero','finance','finance','finance'],['assistant','Asistente administrativo','administration','organization','planning'],['investment','Analista de inversiones','investment','finance','finance'],['auditor','Auditor','audit','honesty','finance'],['hr','Especialista de recursos humanos','people','leadership','morale'],['strategy','Analista de estrategia','strategy','organization','planning']] as const)p('holding',key,name,dep,'specialist',2,1050,sk,{[ef]:.12});
for(const [key,name,dep,sk,rights] of [
 ['ceo','Director ejecutivo (CEO)','direction','leadership',['purchases','prices','hiring','production','transport','maintenance','investment']],
 ['cfo','Director financiero (CFO)','finance','finance',['finance']],
 ['coo','Director de operaciones (COO)','operations','organization',['production','transport','maintenance','hiring']],
 ['chro','Director de recursos humanos (CHRO)','people','leadership',['hiring','training']],
 ['cio','Director de inversiones','investment','finance',['investment']],
 ['cro','Director de riesgos','risk','finance',['finance','maintenance']]
] as [string,string,string,Skill,Responsibility[]][])p('holding',key,name,dep,'general_manager',5,key==='ceo'?2400:1900,sk,{planning:.1,morale:key==='chro'?.15:0},rights,'executive');
export const POSITIONS:readonly Position[]=positions;
export const position=(id:string)=>POSITIONS.find(p=>p.id===id);
export const managerPosition=(p:Position)=>p.rank>=4;
export const sectorPositions=(sector:Sector,variant?:string)=>POSITIONS.filter(p=>p.sector===sector&&(!variant||!p.variants||p.variants.includes(variant)));
