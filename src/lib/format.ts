export const money=(cents:number)=>new Intl.NumberFormat('es-PA',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(cents/100);
export const compactMoney=(cents:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(cents/100);
export const number=(n:number)=>new Intl.NumberFormat('es-PA').format(n);
