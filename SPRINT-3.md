# EMPIRE X · Sprint 3

## Base conservada

Continuación del commit Sprint 2 `8198244c67c65b446a910090263af8a9e243706e`. No se reconstruyó el juego ni se sustituyó el motor minorista. Se conserva la tienda, productos, inventario, personal, capacitación, gerentes, velocidades, pausa, eventos, tutorial y guardados anteriores.

## Industrias y operaciones

| Industria | Instalaciones | Operación verificable |
|---|---|---|
| Comercio | Supermercado y almacén | Vende existencias recibidas; la tienda inicial mantiene sus reglas originales |
| Restaurantes | Cafetería, casual, premium y comida rápida | Menú de tres recetas; cocina consume ingredientes y energía; capacidad, servicio, precios y desperdicio afectan utilidad |
| Logística | Centro logístico y almacén | Cuatro modelos de vehículos, conductor exclusivo, capacidad, combustible, estado mecánico, taller y rutas con duración |
| Manufactura | Fábrica modular y almacén | Cuatro recetas: alimentos, bebidas, limpieza y artículos generales; insumos → producción en curso → productos terminados → entrega mayorista |
| Hotelería | Hostal, económico, empresarial y premium | Reservas limitadas por habitaciones y limpieza; entradas, salidas, noches facturadas, tarifa y temporada |
| Gasolineras | Estación ampliable | Tres combustibles, tanques limitados, ventas por litro recibido, precios y capacidad de atención |

Una empresa puede tener varias sucursales con caja, inventario, empleados, gerente, resultados e historial propios. Hay límites de 20 empresas y 40 instalaciones por partida para mantener trabajo acotado. Cerrar operaciones conserva todos los registros y sigue generando salarios y gastos mínimos. Las habitaciones ya reservadas se atienden aunque el hotel cierre temporalmente.

## Suministro, rutas y contratos

Tres proveedores simulados tienen catálogos, precios, cupos diarios, fiabilidad, descuentos por volumen y negociación según habilidades del personal. Cotizar no cobra. Comprar paga mercancía y flete, reserva espacio en destino y registra inventario en tránsito. La recepción solo habilita unidades una vez.

Los envíos propios siguen esta secuencia: pedido → reserva en origen → despacho → transporte → recepción. La mercancía reservada no puede venderse otra vez. Los envíos externos también tardan. Las distancias derivan de las coordenadas de parcelas, no de un contador decorativo.

Una flota requiere conductores contratados. No puede asignar un conductor a dos vehículos, usar un vehículo ocupado, superar su capacidad o despedir al conductor de una ruta activa. Si renuncia, el pedido queda retrasado hasta asignar reemplazo. El taller ocupa seis horas; las averías y congestión retrasan entregas.

Contratos de suministro, producción por encargo, distribución y transporte programan pedidos recurrentes. Las fábricas y almacenes deben contar con mercancía; el gerente puede programar producción pero el contrato no crea unidades. La primera obligación se genera al siguiente avance horario. Cada incumplimiento o retraso de más de 24 horas tiene una penalización del 2% del pedido, registrada una sola vez por causa. Cancelar detiene pedidos futuros y conserva los comprometidos.

Los contratos de transporte atienden clientes externos simulados. El transporte dentro del grupo se solicita al transferir inventario. El mercado mayorista comparte un cupo diario de 800 unidades por producto; transporte externo tiene 12 pedidos diarios. No hay compradores infinitos.

## Contabilidad y consolidación

Todos los importes son centavos enteros; cada asiento suma cero y no se permite caja negativa. Una misma función contable atiende todas las industrias.

- Construir o adquirir equipo transforma efectivo en activos fijos; su depreciación diaria es un gasto sin movimiento de caja.
- Comprar transforma efectivo en inventario, incluyendo el flete del proveedor.
- La producción consume insumos e incorpora energía al lote en curso. Finalizarlo cambia su ubicación, no reconoce ingresos.
- Venta minorista, plato servido, combustible vendido, noche ocupada o entrega externa completada genera ingreso y el costo correspondiente.
- Los salarios se devengan por hora en su sucursal y se liquidan mensualmente o al pagar obligaciones.
- Las transferencias de efectivo son financiación interna, no ventas.
- Los suministros entre empresas propias se liquidan a costo contable; no crean beneficio interno.
- El flete propio es gasto de una empresa e ingreso de otra. Si falta caja, genera cuentas por pagar y cobrar simétricas. Su pago posterior cancela saldos sin repetir ingresos.
- El consolidado elimina ingresos y gastos de fletes internos. Las cuentas internas por cobrar y pagar se muestran explícitas y se compensan al calcular patrimonio del grupo.

La pantalla financiera explica ingresos, costo de ventas, gastos, deudas y referencias. El historial completo de asientos se conserva en la persistencia; la interfaz muestra registros recientes. Configuración permite descargar el libro empresarial. Exportar/importar una partida traslada saldos expresamente identificados; no inventa ventas históricas. Exporta también el libro para conservar el detalle anterior a una importación.

## Gerentes y personas

Cinco especialistas se integran con los modos Manual, Supervisado y Autónomo del Sprint 2. Compras, precios, contratación, producción, rutas, mantenimiento e inversión usan acciones reales y vuelven a validar caja, reserva, riesgo y presupuestos antes de ejecutarse. Supervisado requiere aprobación para inversiones, contrataciones y operaciones superiores a la mitad del límite individual.

Los gerentes industriales seleccionan insumos de su receta prioritaria; el consumo observado ajusta futuras compras. Los de logística eligen entre vehículos libres compatibles el de menor consumo. Hoteles y gasolineras ajustan sus tarifas; gastronomía gestiona ingredientes y puestos requeridos. Finanzas, personalidad, aprendizaje y habilidades organizativas afectan cobertura, selección y preferencias.

Las propuestas se pueden aprobar, rechazar, posponer o modificar cuando admiten cantidad/precio. Una propuesta ejecutada o rechazada no vuelve a ejecutarse. Informes distinguen acciones de recomendaciones, y evaluaciones semanales incluyen presupuesto, faltantes, eficiencia, satisfacción y recursos; no atribuyen toda diferencia de utilidad exclusivamente al gerente.

El jugador puede activar una línea automática directamente. Esa programación manual utiliza la caja disponible de la fábrica. Para restringirla por presupuesto gerencial, desactívala y delega Producción al gerente.

## Guardado

Esquema 3, migración determinista y aditiva desde 1/2. Antes de migrar se conserva la copia original. IndexedDB mantiene hasta ocho partidas, libro, registros gerenciales y referencias de operaciones. Importar crea una copia pausada; exportar incluye checksum de integridad. El guardado HTML previo se reconoce en el mismo origen y navegador; también se puede importar su respaldo.

Pages es almacenamiento local, sin sincronización en nube. Cambiar navegador, dispositivo u origen requiere exportar/importar. No borres los datos del navegador antes de guardar una copia.

## Balance y alcance

No hay ganancias garantizadas. Una fábrica con poco volumen puede perder aunque su margen unitario sea positivo; una flota con una sola ruta diaria puede no cubrir su plantilla. El informe de pruebas muestra escenarios rentables y deficitarios de las cinco industrias.

No incluye préstamos, bolsa, bancos, venta de instalaciones, proveedores reales, rutas geográficas reales ni la tienda de conveniencia de las gasolineras. Los establecimientos y personajes son ficticios. No usa IA generativa de pago ni servicios externos obligatorios.
