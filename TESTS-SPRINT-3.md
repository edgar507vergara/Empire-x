# Validación ejecutada · Sprint 3

Fecha: 17 de noviembre de 2026. Entorno: Node.js y navegador Chromium de pruebas. No se utilizó un Android físico.

## Automatizadas

`npm test`: **67 pruebas aprobadas, 0 fallidas**. Incluye las 41 pruebas previas con las expectativas de versión migradas a esquema 3, 24 pruebas empresariales y dos pruebas nuevas de persistencia SQL.

`npm run typecheck`: aprobado.

`npm run build:pages`: compilación estática comprobada. React/interfaz y Phaser se descargan en archivos separados.

Cobertura: seis industrias, empresas y sucursales, parcelas exclusivas, contratación y asignación, proveedores, compras sin fondos, tránsito y recepción única, recetas, producción con capacidad, reservas y facturación hotelera, combustible, vehículos ocupados y sobrecarga, reemplazo de conductor, contratos y penalizaciones, transferencias sin duplicar unidades, pagos internos simétricos, consolidación, autonomía y límites, aprobación/rechazo sin duplicados, capacitación, renuncia, informes, integridad, importación/exportación, migraciones 1/2, pausa y velocidades.

SQLite real verifica transacciones, rollback, reintento idempotente, aislamiento de propietarios, mayor y respaldo previo a migración. No se declara una prueba anual de base remota.

## Simulaciones prolongadas

365 días multiindustria: **159,811 asientos empresariales**, **365 entregas propias**, todos los balances conciliados por entidad contra sus asientos al cierre de cada día. Tiempo del motor: aproximadamente **7.9 segundos** en el entorno de ejecución, excluyendo red y renderizado. Se validaron caja no negativa, inventario/tránsito/WIP, presupuestos, referencias y guardados.

La prueba previa de 365 días con gerencia minorista también pasó: 715 compras, 93,933 ventas y 2,486 registros gerenciales. No es una medición de batería, FPS ni CPU de Android.

Escenarios de 60 días, cambio de utilidad durante el período, USD simulados:

| Industria | Operación abastecida / activa | Operación deficiente |
|---|---:|---:|
| Restaurante | 2,297.65 | −5,456.23 |
| Fábrica | 7,819.25 | −6,169.89 |
| Hotel | 4,413.68 | −6,523.96 |
| Gasolinera | 52,058.47 | −4,735.69 |
| Logística | 4,376.87 | −4,709.13 |

El escenario rentable configura inventario, gerencia y contratos; la flota recibe tres pedidos diarios y la fábrica prioriza limpieza. El deficiente no automatiza compras/despachos y el hotel está sobrevalorado. El capital adicional pertenece exclusivamente a una fixture contable de pruebas con contrapartida de patrimonio; no se introduce en partidas normales.

## Interfaz revisada

En Chromium: nueva partida, creación de empresa, construcción de cafetería, contratación de gerente gastronómico, asignación de sucursal, cambio a supervisado, límite por compra, análisis, compras automáticas, aprobación de contratación, informe e historial de decisiones. Se verificaron cargos reales en caja y guardado.

Recarga y Continuar conservaron empresa, sucursal, gerente, personal, pedidos y saldos. A 390×844 se revisaron navegación, Administración y mapa. El contenido tenía ancho 375 px y scrollWidth 375 px (sin desbordamiento horizontal); lienzo del mapa 337×350, con zoom operativo. No equivale a una prueba en dispositivo Android físico.

## Límites explícitos

Las pruebas reproducibles verifican reglas e invariantes, no todas las estrategias posibles ni todos los dispositivos. El simulador acota empresas, instalaciones, flota e historiales visibles. El diario persistente es acumulativo y depende del espacio disponible del navegador. Exportar el libro conserva el detalle contable anterior a una importación de saldos.
