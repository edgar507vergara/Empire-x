import type {Career} from '../workforce/types';
import type {IndustryAction} from '../enterprise/types';
import type { Command, Employee, GameState } from '../simulation/types';
export const MANAGER_ROLES = ['general_manager','operations_manager','commercial_manager','finance_manager','hr_manager','inventory_manager','restaurant_manager','logistics_manager','industrial_manager','hotel_manager','fuel_manager'] as const;
export type ManagerRole = typeof MANAGER_ROLES[number];
export type Responsibility = 'purchases'|'prices'|'hiring'|'training'|'finance'|'production'|'transport'|'maintenance'|'investment';
export type Strategy = 'profit'|'sales'|'competitive'|'liquidity'|'slow_stock'|'balanced';
export type Trait = 'Ambicioso'|'Conservador'|'Innovador'|'Analítico'|'Disciplinado'|'Sociable'|'Competitivo'|'Leal'|'Arriesgado';
export interface Permissions { perPurchase:number; daily:number; monthly:number; hiringLimit:number; priceRange:number; risk:number; reserve:number }
export interface ManagerConfig { autonomy:'manual'|'supervised'|'autonomous'; responsibilities:Responsibility[]; limits:Permissions; strategy:Strategy; spentDay:number; spentMonth:number; day:number; month:string; hires:number; learning:number }
export interface HRProfile { career?:Career; companyId:string|null; facilityId?:string; hiredAt:number|null; level:number; xp:number; traits:Trait[]; expectedSalary:number; favorite:boolean; rejected:boolean; expires:number; unhappyDays:number; causes:string[]; lastEventDay:number; training:Training|null; manager:ManagerConfig|null }
export interface Training { courseId:string; started:number; ends:number; before:number; expected:number }
export type Skill = 'productivity'|'leadership'|'finance'|'negotiation'|'commerce'|'creativity'|'organization'|'honesty'|'loyalty'|'motivation'|'stressResistance'|'learning';
export type Action = {type:'industry';operation:IndustryAction}|{type:'hr_control_costs';employeeId:string;reserve:number}|{type:'buy_stock';productId:string;quantity:number}|{type:'set_price';productId:string;price:number}|{type:'hire';employeeId:string}|{type:'hr_train';employeeId:string;courseId:string};
export interface Observation { cash:number; stock:number; dailyDemand:number; demandSource:string; capacity:number; payroll:number; upcoming:number; warehouseFree:number; revenue:number; profit:number; units:number; lost:number; openMinutes:number; satisfaction:number; reputation:number; price:number; unitCost:number }
export interface Decision { id:string; managerId:string; companyId:string; second:number; expires:number; wake:number; key:string; problem:string; action:Action; cost:number; benefit:string; risk:number; justification:string; score:number; data:Observation; status:'pending'|'postponed'|'executed'|'rejected'|'expired'|'blocked'; reason:string; executedAt:number|null; evaluateAt:number|null; actual:string|null; cashChange:number; baseline:Observation|null }
export interface ManagementLog { id:string; second:number; employeeId:string|null; companyId:string; type:string; description:string; decisionId?:string; data?:unknown; cost:number }
export interface Notice { id:string; second:number; category:'Finanzas'|'Personal'|'Inventario'|'Ventas'|'Gerencia'|'Oportunidades'|'Riesgos'; priority:'info'|'important'|'critical'; title:string; detail:string; key:string; read:boolean }
export interface HRIncident { id:string; employeeId:string|null; second:number; kind:'raise'|'offer'|'conflict'|'training'|'exceptional'|'resignation'|'reorganize'|'promotion'|'motivation'|'recognition'; title:string; cause:string; cost:number; resolved:boolean; outcome:string; expires:number }
export interface ManagerReport { id:string; managerId:string; second:number; companyName:string; facts:Observation; problems:string[]; actions:string[]; results:string[]; recommendations:string[]; risks:string[] }
export interface Evaluation { id:string; managerId:string; day:number; score:number; indicators:{profit:number; efficiency:number; budget:number; turnover:number; lost:number; productivity:number; satisfaction:number}; context:string }
export interface ManagementState { marketWeek:number; dailySales:{day:number; units:Record<string,number>; lost:Record<string,number>; openMinutes:number}[]; decisions:Decision[]; logs:ManagementLog[]; notifications:Notice[]; incidents:HRIncident[]; reports:ManagerReport[]; evaluations:Evaluation[]; cooldowns:Record<string,number> }
export type ManagementCommand = {type:'hr_control_costs';employeeId:string;reserve:number}
 | {type:'hr_candidate';employeeId:string;action:'favorite'|'reject'}
 | {type:'hr_assign';employeeId:string;companyId:string|null;facilityId?:string}
 | {type:'hr_configure';employeeId:string;autonomy:ManagerConfig['autonomy'];responsibilities:Responsibility[];limits:Permissions;strategy:Strategy}
 | {type:'hr_analyze';employeeId:string}
 | {type:'hr_decide';decisionId:string;choice:'approve'|'reject'|'postpone';quantity?:number;price?:number}
 | {type:'hr_train';employeeId:string;courseId:string}
 | {type:'hr_promote';employeeId:string;role:ManagerRole|'supervisor'}
 | {type:'hr_report';employeeId:string}
 | {type:'hr_event';eventId:string;choice:'accept'|'decline'}
 | {type:'hr_read_notices'};
export interface Operations { apply:(command:Command)=>void; expense:(amount:number,cause:string,ref:string)=>void; purchaseCost:(productId:string)=>number; quit:(employee:Employee)=>void; log:(record:ManagementLog)=>void }
export type ManagedState=GameState & {management:ManagementState};
