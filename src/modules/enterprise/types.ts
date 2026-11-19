import type { Account, Entry, Stock } from '../simulation/types';
export type Industry='retail'|'restaurant'|'logistics'|'factory'|'hotel'|'fuel';
export type WorkerRole='specialist'|'cook'|'waiter'|'driver'|'operator'|'receptionist'|'housekeeper'|'attendant';
export type Accounts=Record<Account,number>;
export interface EnterpriseCompany {id:string;name:string;industry:Industry;accounts:Accounts;created:number;capital:number}
export interface BusinessDay {day:number;revenue:number;cogs:number;expenses:number;units:number;lost:number;produced:number;waste:number;deliveries:number;occupied:number;capacity:number;internalRevenue:number;internalExpense:number}
export interface Facility {id:string;companyId:string;name:string;industry:Industry;variant:string;kind:'business'|'warehouse';tileId:number;builtAt:number;open:boolean;accounts:Accounts;inventory:Stock[];reputation:number;condition:number;quality:number;capacity:number;storage:number;level:number;history:BusinessDay[];usage?:Record<string,{day:number;quantity:number}[]>;prices:Record<string,number>;carry:number;wageCarry:number;assetBasis:number;depreciated:number;selectedRecipe:string|null;autoProduction:boolean;internalRevenue:number;internalExpense:number}
export interface Supplier {id:string;name:string;sector:string;factor:number;dailyCapacity:number;hours:number;reliability:number;reputation:number;catalog:string[];discount:number}
export interface Production {id:string;facilityId:string;recipeId:string;quantity:number;value:number;started:number;remainingHours:number;status:'working'|'completed';completedAt:number|null}
export interface Vehicle {id:string;facilityId:string;model:string;driverId:string|null;condition:number;orderId:string|null;maintainingUntil:number;deliveries:number;distance:number}
export interface Shipment {id:string;fromId:string;toId:string;productId:string;quantity:number;value:number;price:number;freight:number;volume:number;distance:number;created:number;due:number;deliveredAt:number|null;status:'reserved'|'transit'|'delayed'|'delivered';carrierId:string;vehicleId:string|null;contractId:string|null;period:number|null;delayReason:string|null;delays:number;payment:'prepaid'|'on_delivery';externalCargo:boolean;outstanding?:number;deadline?:number;latePenalized?:boolean}
export interface BusinessContract {id:string;facilityId:string;partnerId:string;type:'supply'|'transport'|'production'|'distribution';productId:string;quantity:number;unitPrice:number;everyDays:number;starts:number;ends:number;nextDue:number;penalty:number;status:'active'|'completed'|'cancelled';fulfilled:number;missed:number;lastPeriod:number;reason:string}
export interface EconomicEvent {id:string;kind:'raw_cost'|'tourism'|'fuel_shortage'|'breakdown'|'dining'|'delay'|'bulk'|'recession';starts:number;ends:number;title:string;detail:string;facilityId:string|null}
export interface BusinessRecord extends Entry {companyId:string;facilityId:string;counterparty?:string;internal:boolean}
export interface EnterpriseState {companies:EnterpriseCompany[];facilities:Facility[];suppliers:Supplier[];production:Production[];vehicles:Vehicle[];shipments:Shipment[];contracts:BusinessContract[];events:EconomicEvent[];journal:BusinessRecord[];supplierUsage:Record<string,number>;marketUsage:Record<string,number>;negotiated:Record<string,number>;bookings:{id:string;facilityId:string;rooms:number;rate:number;arrival:number;departure:number;status:'reserved'|'checked_in'|'completed'}[];lastDay:number;internalTransport:number;objectives:boolean[]}
export type IndustryAction=
 | {type:'ex_training';facilityId:string;employeeId:string;courseId:string}
 | {type:'ex_reserve';facilityId:string;employeeId:string;reserve:number}
 | {type:'ex_driver';vehicleId:string;employeeId:string}
 | {type:'ex_purchase';facilityId:string;supplierId:string;productId:string;quantity:number}
 | {type:'ex_price';facilityId:string;productId:string;price:number}
 | {type:'ex_produce';facilityId:string;recipeId:string;quantity:number}
 | {type:'ex_dispatch';orderId:string;vehicleId:string}
 | {type:'ex_maintain';facilityId:string;vehicleId?:string}
 | {type:'ex_vehicle';facilityId:string;model:string;driverId:string}
 | {type:'ex_upgrade';facilityId:string}
 | {type:'ex_hire';facilityId:string;employeeId:string};
export type EnterpriseCommand=IndustryAction
 | {type:'ex_company';name:string;industry:Industry;capital:number}
 | {type:'ex_facility';companyId:string;name:string;variant:string;tileId:number;capital:number;warehouse?:boolean}
 | {type:'ex_cash';fromId:string;toId:string;amount:number}
 | {type:'ex_open';facilityId:string;open:boolean}
 | {type:'ex_driver';vehicleId:string;employeeId:string}
 | {type:'ex_assign';employeeId:string;facilityId:string}
 | {type:'ex_negotiate';facilityId:string;supplierId:string}
 | {type:'ex_internal';fromId:string;toId:string;productId:string;quantity:number;carrierId:string}
 | {type:'ex_order';facilityId:string;productId:string;quantity:number;carrierId:string}
 | {type:'ex_contract';facilityId:string;partnerId:string;kind:BusinessContract['type'];productId:string;quantity:number;unitPrice:number;everyDays:number;durationDays:number}
 | {type:'ex_cancel_contract';contractId:string}
 | {type:'ex_pay_due';facilityId:string}
 | {type:'ex_line';facilityId:string;recipeId:string;enabled:boolean};
