import type {Account,Entry} from './types';
/** Shared by the original retail engine and every industry. Integer cents, balanced and atomic. */
export function postAccounts(accounts:Record<Account,number>,lines:Entry['lines']){
 if(lines.some(l=>!Number.isSafeInteger(l.amount))||lines.reduce((n,l)=>n+l.amount,0)!==0)throw new Error('Asiento contable inválido.');
 const next={...accounts};for(const l of lines)next[l.account]+=l.amount;
 if(Object.values(next).some(v=>!Number.isSafeInteger(v))||next.receivable<0||next.cash<0||next.inventory<0||next.fixedAssets<0||next.payable>0)throw new Error('La operación produciría un saldo no autorizado.');
 Object.assign(accounts,next);
}
export const zeroAccounts=():Record<Account,number>=>({receivable:0,cash:0,inventory:0,fixedAssets:0,payable:0,equity:0,revenue:0,cogs:0,expenses:0});
