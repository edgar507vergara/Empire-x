import {z} from 'zod';
import {employeeId as id} from '../management/schema';
const quantity=z.number().int().min(1).max(50000),money=z.number().int().min(0).max(100000000),facilityId=id,productId=id;
export const industry=z.enum(['retail','restaurant','logistics','factory','hotel','fuel']);
export const industryActions=[
 z.object({type:z.literal('ex_driver'),vehicleId:id,employeeId:id}).strict(),
 z.object({type:z.literal('ex_training'),facilityId,employeeId:id,courseId:z.enum(['leadership','sales','finance','service','organization','operations'])}).strict(),
 z.object({type:z.literal('ex_reserve'),facilityId,employeeId:id,reserve:money}).strict(),
 z.object({type:z.literal('ex_purchase'),facilityId,supplierId:id,productId,quantity}).strict(),
 z.object({type:z.literal('ex_price'),facilityId,productId,price:money.min(1).max(1000000)}).strict(),
 z.object({type:z.literal('ex_produce'),facilityId,recipeId:id,quantity:quantity.max(1000)}).strict(),
 z.object({type:z.literal('ex_dispatch'),orderId:id,vehicleId:id}).strict(),
 z.object({type:z.literal('ex_maintain'),facilityId,vehicleId:id.optional()}).strict(),
 z.object({type:z.literal('ex_vehicle'),facilityId,model:z.enum(['van','light','medium','heavy']),driverId:id}).strict(),
 z.object({type:z.literal('ex_upgrade'),facilityId}).strict(),
 z.object({type:z.literal('ex_hire'),facilityId,employeeId:id}).strict(),
] as const;
export const enterpriseCommands=[...industryActions,
 z.object({type:z.literal('ex_company'),name:z.string().trim().min(2).max(60),industry,capital:money.min(1)}).strict(),
 z.object({type:z.literal('ex_facility'),companyId:id,name:z.string().trim().min(2).max(60),variant:id,tileId:z.number().int().min(0).max(399),capital:money,warehouse:z.boolean().optional()}).strict(),
 z.object({type:z.literal('ex_cash'),fromId:id,toId:id,amount:money.min(1)}).strict(),
 z.object({type:z.literal('ex_open'),facilityId,open:z.boolean()}).strict(),
 z.object({type:z.literal('ex_assign'),employeeId:id,facilityId}).strict(),
 z.object({type:z.literal('ex_negotiate'),facilityId,supplierId:id}).strict(),
 z.object({type:z.literal('ex_internal'),fromId:id,toId:id,productId,quantity,carrierId:id}).strict(),
 z.object({type:z.literal('ex_order'),facilityId,productId,quantity,carrierId:id}).strict(),
 z.object({type:z.literal('ex_contract'),facilityId,partnerId:id,kind:z.enum(['supply','transport','production','distribution']),productId,quantity,unitPrice:money.min(1),everyDays:z.number().int().min(1).max(30),durationDays:z.number().int().min(1).max(365)}).strict(),
 z.object({type:z.literal('ex_cancel_contract'),contractId:id}).strict(),
 z.object({type:z.literal('ex_pay_due'),facilityId}).strict(),
 z.object({type:z.literal('ex_line'),facilityId,recipeId:id,enabled:z.boolean()}).strict()
] as const;
