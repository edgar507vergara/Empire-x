import type { Difficulty, Product, Role } from './types';
export const BALANCE = Object.freeze({
  initial: { easy: 5_000_000, normal: 2_500_000, hard: 1_000_000 } as Record<Difficulty, number>,
  land: 200_000, construction: 400_000, equipment: 300_000, usedEquipment: 150_000,
  hireFee: 20_000, openingFee: 80_000, dailyOperating: 4500, dailyClosed: 800,
  dailyMarketing: 2000, maxEmployees: 8, maxStock: 10000,
  tickSeconds: 60, secondsPerRealSecond: 4, leaseMs: 15_000,
  maxSaves: 8,
});
export const PRODUCTS: Product[] = [
  { id: 'food', name: 'Alimentos esenciales', category: 'Alimentos', cost: 250, suggested: 450, demand: 14, color: '#E5B45A' },
  { id: 'drinks', name: 'Bebidas y refrescos', category: 'Bebidas', cost: 125, suggested: 275, demand: 18, color: '#19C4B5' },
  { id: 'cleaning', name: 'Limpieza del hogar', category: 'Limpieza', cost: 400, suggested: 700, demand: 7, color: '#8B9CF4' },
  { id: 'general', name: 'Artículos cotidianos', category: 'General', cost: 600, suggested: 1000, demand: 5, color: '#EC8D99' },
];
export const ROLE_LABEL: Record<Role, string> = { cook:'Cocinero',waiter:'Mesero',driver:'Conductor',operator:'Operario',receptionist:'Recepcionista',housekeeper:'Personal de limpieza',attendant:'Despachador',restaurant_manager:'Gerente gastronómico',logistics_manager:'Gerente de logística',industrial_manager:'Gerente industrial',hotel_manager:'Gerente hotelero',fuel_manager:'Gerente de gasolinera', cashier: 'Cajero', salesperson: 'Vendedor', stocker: 'Reponedor', supervisor: 'Supervisor', general_manager:'Gerente general', operations_manager:'Gerente de operaciones', commercial_manager:'Gerente comercial', finance_manager:'Gerente financiero', hr_manager:'Gerente de recursos humanos', inventory_manager:'Gerente de inventario y compras' };
export const MISSIONS = [
  ['Tu primer espacio', 'Compra un terreno comercial.', 'La ubicación determina cuántos clientes potenciales pasan por tu negocio.'],
  ['De idea a negocio', 'Construye tu primera tienda.', 'El local y el equipo son activos: invertir reduce tu caja, pero no es una pérdida inmediata.'],
  ['Estantes con posibilidades', 'Compra tu primera mercancía.', 'La mercancía es inventario. Su costo se convierte en gasto cuando se vende.'],
  ['Tu primer equipo', 'Contrata a un cajero.', 'Reserva efectivo para salarios. La productividad afecta la capacidad de atención.'],
  ['Abierto al futuro', 'Equipa y abre la tienda.', 'A partir de ahora, tus precios, ubicación y personal determinan los resultados.'],
  ['Las primeras 10', 'Vende 10 unidades.', 'Cada venta registra ingreso, costo y salida de inventario.'],
  ['Cien pequeñas decisiones', 'Vende 100 unidades.', 'Un precio más alto aumenta el margen, pero puede reducir la demanda.'],
  ['Números en verde', 'Completa un día rentable.', 'Utilidad = ingresos − costo de mercancía vendida − gastos devengados.'],
  ['Una semana en marcha', 'Opera durante 7 días completos.', 'El crecimiento necesita reposición, personal y suficiente liquidez.'],
  ['Piensa como empresario', 'Consulta tu informe financiero.', 'La caja y la utilidad son diferentes. Revisa ambas antes de invertir.'],
] as const;
export const START_DATE = Date.UTC(2030, 0, 1);
export function gameDate(second: number) { return new Date(START_DATE + second * 1000); }
