import { z } from 'zod';
export const employeeId=z.string().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/);
export const managerRole=z.enum(['general_manager','operations_manager','commercial_manager','finance_manager','hr_manager','inventory_manager','restaurant_manager','logistics_manager','industrial_manager','hotel_manager','fuel_manager']);
export const autonomy=z.enum(['manual','supervised','autonomous']);
export const responsibility=z.enum(['purchases','prices','hiring','training','finance','production','transport','maintenance','investment']);
export const strategy=z.enum(['profit','sales','competitive','liquidity','slow_stock','balanced']);
const money=z.number().int().min(0).max(100000000);
export const limits=z.object({perPurchase:money,daily:money,monthly:money,hiringLimit:z.number().int().min(0).max(8),priceRange:z.number().int().min(0).max(30),risk:z.number().int().min(0).max(100),reserve:money}).strict();
export const managementCommands=[z.object({type:z.literal('hr_control_costs'),employeeId,reserve:money}).strict(),
 z.object({type:z.literal('hr_candidate'),employeeId,action:z.enum(['favorite','reject'])}).strict(),
 z.object({type:z.literal('hr_assign'),employeeId,companyId:employeeId.nullable(),facilityId:employeeId.optional()}).strict(),
 z.object({type:z.literal('hr_configure'),employeeId,autonomy,responsibilities:z.array(responsibility).max(9),limits,strategy}).strict(),
 z.object({type:z.literal('hr_analyze'),employeeId}).strict(),
 z.object({type:z.literal('hr_decide'),decisionId:employeeId,choice:z.enum(['approve','reject','postpone']),quantity:z.number().int().min(1).max(10000).optional(),price:z.number().int().min(1).max(100000).optional()}).strict(),
 z.object({type:z.literal('hr_train'),employeeId,courseId:z.enum(['leadership','sales','finance','service','organization','operations'])}).strict(),
 z.object({type:z.literal('hr_promote'),employeeId,role:z.union([managerRole,z.literal('supervisor')])}).strict(),
 z.object({type:z.literal('hr_report'),employeeId}).strict(),
 z.object({type:z.literal('hr_event'),eventId:employeeId,choice:z.enum(['accept','decline'])}).strict(),
 z.object({type:z.literal('hr_read_notices')}).strict()
] as const;
