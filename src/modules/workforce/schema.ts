import {z} from 'zod';
const id=z.string().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/),n=z.number().int().nonnegative();
export const sectorSchema=z.enum(['retail','restaurant','hotel','fuel','factory','logistics','banking','holding']);
export const careerSchema=z.object({positionId:id,department:id,primary:sectorSchema,secondary:z.array(sectorSchema).max(8),sectorXP:z.partialRecord(sectorSchema,n.max(100000)),certificates:z.array(id).max(120),adaptationUntil:n,scope:z.enum(['facility','holding']),supervises:z.array(id).max(20),legacy:z.boolean(),retraining:z.object({positionId:id,started:n,ends:n,expected:n.max(100)}).nullable()}).strict();
export const workforceCommands=[
 z.object({type:z.literal('wf_hire'),employeeId:id,facilityId:id,positionId:id}).strict(),
 z.object({type:z.literal('wf_transfer'),employeeId:id,facilityId:id,positionId:id}).strict(),
 z.object({type:z.literal('wf_promote'),employeeId:id,positionId:id}).strict(),
 z.object({type:z.literal('wf_retrain'),employeeId:id,positionId:id}).strict(),
 z.object({type:z.literal('wf_scope'),employeeId:id,companyIds:z.array(id).max(20)}).strict()
] as const;
