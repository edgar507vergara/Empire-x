import type {Industry} from '../enterprise/types';
export type Sector=Industry|'banking'|'holding';
export interface Career {positionId:string;department:string;primary:Sector;secondary:Sector[];sectorXP:Partial<Record<Sector,number>>;certificates:string[];adaptationUntil:number;scope:'facility'|'holding';supervises:string[];legacy:boolean;retraining:{positionId:string;started:number;ends:number;expected:number}|null}
export type WorkforceCommand={type:'wf_hire';employeeId:string;facilityId:string;positionId:string}
 |{type:'wf_transfer';employeeId:string;facilityId:string;positionId:string}
 |{type:'wf_promote';employeeId:string;positionId:string}
 |{type:'wf_retrain';employeeId:string;positionId:string}
 |{type:'wf_scope';employeeId:string;companyIds:string[]};
