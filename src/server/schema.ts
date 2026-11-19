import {workforceCommands} from '../modules/workforce/schema';
import {enterpriseCommands} from '../modules/enterprise/schema';
import {managementCommands,employeeId} from '../modules/management/schema';
import { z } from 'zod';
const empty = <T extends string>(type: T) => z.object({ type: z.literal(type) }).strict();
export const commandSchema = z.discriminatedUnion('type', [...workforceCommands,...managementCommands,...enterpriseCommands,
  z.object({ type: z.literal('buy_land'), tileId: z.number().int().min(0).max(399) }).strict(),
  empty('pay_due'), empty('build'), z.object({type:z.literal('equip'),used:z.boolean().optional()}).strict(), empty('report'), empty('pause'), empty('heartbeat'),
  z.object({ type: z.literal('buy_stock'), productId: z.enum(['food','drinks','cleaning','general']), quantity: z.number().int().min(1).max(10000) }).strict(),
  z.object({ type: z.literal('set_price'), productId: z.enum(['food','drinks','cleaning','general']), price: z.number().int().min(1).max(100000) }).strict(),
  z.object({ type: z.literal('hire'), employeeId: employeeId }).strict(),
  z.object({ type: z.literal('fire'), employeeId: employeeId }).strict(),
  z.object({ type: z.literal('set_open'), open: z.boolean() }).strict(),
  z.object({ type: z.literal('configure'), name: z.string().trim().min(2).max(60), marketing: z.boolean() }).strict(),
  z.object({ type: z.literal('speed'), speed: z.union([z.literal(0),z.literal(1),z.literal(2),z.literal(5),z.literal(10)]) }).strict(),
  z.object({ type: z.literal('event'), eventId: z.string().max(80), choice: z.enum(['accept','decline']) }).strict(),
]);
export const actionSchema = z.object({ requestId: z.uuid(), controller: z.uuid(), command: commandSchema }).strict();
export const newGameSchema = z.object({ requestId: z.uuid(), playerName: z.string().trim().min(2).max(40), companyName: z.string().trim().min(2).max(60), difficulty: z.enum(['easy','normal','hard']) }).strict();
