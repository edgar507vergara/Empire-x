import type {EnterpriseState,EnterpriseCommand,BusinessRecord,WorkerRole} from '../enterprise/types';
import type { HRProfile, ManagementState, ManagementCommand, ManagementLog, ManagerRole } from '../management/types';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type Speed = 0 | 1 | 2 | 5 | 10;
export type Role = 'cashier' | 'salesperson' | 'stocker' | 'supervisor' | ManagerRole | WorkerRole;
export type Account = 'receivable' | 'cash' | 'inventory' | 'fixedAssets' | 'payable' | 'equity' | 'revenue' | 'cogs' | 'expenses';
export type TileKind = 'road' | 'available' | 'residential' | 'commercial' | 'industrial' | 'park';
export interface Tile { id: number; x: number; y: number; kind: TileKind; district: string; traffic: number; price: number; owned: boolean }
export interface Product { id: string; name: string; category: string; cost: number; suggested: number; demand: number; color: string }
export interface Stock { productId: string; quantity: number; value: number; price: number }
export interface Attributes { productivity: number; experience: number; leadership: number; motivation: number; loyalty: number; stress: number; potential: number; finance?:number; negotiation?:number; commerce?:number; creativity?:number; organization?:number; honesty?:number; stressResistance?:number; learning?:number }
export interface Employee { id: string; name: string; age: number; role: Role; salary: number; attributes: Attributes; hired: boolean; dismissed: boolean; accrued: number; arrears?: number; carry: number; hr?:HRProfile }
export interface Entry { id: string; second: number; cause: string; reference: string; flow: 'operating' | 'investing' | 'financing' | 'noncash'; lines: { account: Account; amount: number }[] }
export interface Sale { id: string; second: number; productId: string; quantity: number; unitPrice: number; revenue: number; cost: number }
export interface Movement { id: string; second: number; productId: string; quantity: number; value: number; reference: string }
export interface GameEvent { id: string; day: number; type: 'demand' | 'discount' | 'raise' | 'cost' | 'complaint' | 'promotion'; title: string; description: string; expires: number; resolved: boolean; choice?: string }
export interface DayReport { day: number; revenue: number; cogs: number; expenses: number; units: number; clients: number; lost: number; openMinutes: number }
export interface Company { name: string; tileId: number | null; built: boolean; equipped: boolean; equipmentQuality: number; open: boolean; reputation: number; openedOnce: boolean; openingFeePaid: boolean; operatingDays: number; reportsViewed: number; marketing: boolean }
export interface Clock { second: number; tick: number; speed: Speed; lastRealMs: number; leaseUntilMs: number; controller: string | null; remainderMs: number }
export interface GameState {
  schemaVersion: 1 | 2 | 3; enterprise?:EnterpriseState; management?:ManagementState; id: string; playerName: string; difficulty: Difficulty; seed: number; rng: number;
  clock: Clock; company: Company; accounts: Record<Account, number>; tiles: Tile[]; inventory: Stock[];
  employees: Employee[]; events: GameEvent[]; missions: boolean[]; history: DayReport[];
  totals: { units: number; clients: number; lost: number; openMinutes: number };
  sequence: number; capacityCarry: number; operatingCarry: number; marketingCarry: number;
  notice: string | null;
}
export interface Delta { enterpriseEntries?:BusinessRecord[]; managementLogs?:ManagementLog[]; entries: Entry[]; sales: Sale[]; movements: Movement[]; ticks: { tick: number; second: number }[] }
export interface Transition { state: GameState; delta: Delta }
export type Command = ManagementCommand | EnterpriseCommand
  | { type: 'buy_land'; tileId: number }
  | { type: 'build' } | { type: 'equip'; used?: boolean }
  | { type: 'buy_stock'; productId: string; quantity: number }
  | { type: 'set_price'; productId: string; price: number }
  | { type: 'hire'; employeeId: string } | { type: 'fire'; employeeId: string }
  | { type: 'set_open'; open: boolean }
  | { type: 'configure'; name: string; marketing: boolean }
  | { type: 'pay_due' } | { type: 'report' } | { type: 'event'; eventId: string; choice: 'accept' | 'decline' }
  | { type: 'speed'; speed: Speed } | { type: 'heartbeat' } | { type: 'pause' };
