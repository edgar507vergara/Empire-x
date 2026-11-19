# Sprint 4 · Pruebas ejecutadas

Ejecución: 18 de noviembre de 2026, Node.js 24.22.3, Linux de desarrollo.

- `npm run typecheck`: aprobado.
- `npm test`: **91/91**, cero fallos, 12.34 segundos en esta ejecución.
- `npm run build:pages`: aprobado; salida estática con rutas relativas.
- 67 pruebas de los sprints anteriores y 24 pruebas de `tests/workforce.test.ts`.

## Cobertura de la ampliación

1. Catálogos de ocho sectores, departamentos y gerentes; banca reservada para el futuro.
2. Contratación compatible por todas las entradas, nómina y cuentas de sucursal.
3. Salarios diferentes según cargo, experiencia, habilidades, nivel, tamaño y demanda.
4. Chefs/meseros afectan capacidad y demanda; sin operario la fábrica no abre.
5. Mantenimiento reduce deterioro/costo; calidad industrial reduce merma real.
6. Planificación logística reduce combustible/tiempo y conserva restricciones de vehículos.
7. Transferencia atómica, liquidación del salario y persona/nómina únicas; rechazo sin caja.
8. Reconversión con costo, duración, certificado y adaptación entre hotel/fábrica.
9. Carrera completa de comercio, requisitos de ascenso y aumento salarial.
10. Permisos sectoriales: gerente de ingresos no recibe producción/compras.
11. Especialista industrial supera a reconvertido en condiciones comparables.
12. Holding: varias empresas, presupuestos conjuntos, alcance revocable y salario único.
13. CHRO ejecuta capacitación real; CFO eleva reserva sin inventar ingresos/ahorros.
14. Empresas pequeñas con mínimos reducidos; exceso de personal aumenta gastos.
15. Migraciones 1/2/3 conservan identidad, contratos, atributos, experiencia e historial.
16. Exportación, carga y continuación determinista preservan certificaciones y alcance.
17. Integridad/API rechazan asignaciones ambiguas o manipuladas.
18. Regresión: pausa/velocidades, inventario, contratos, producción, ventas, contabilidad, eventos, despidos, migraciones y persistencia transaccional.

## Simulaciones anuales y balance

Se ejecutaron cuatro recorridos de 365 días: comercio original, gerencia anterior, ecosistema multiindustria y profesiones nuevas con dirección corporativa. El caso nuevo tardó 8.04 s en el equipo de desarrollo, conservó 136 personas/candidatos y registró 2,491 decisiones ejecutadas. Cada día verifica integridad, presupuestos y asientos equilibrados. No es una medición de rendimiento de Android físico.

El ecosistema anual conciliaba 173,620 asientos y 365 entregas. La prueba comparativa de 60 días obtuvo:

| Industria | Operación favorable (USD) | Operación desfavorable (USD) |
|---|---:|---:|
| Restaurantes | 436.03 | -5,456.23 |
| Fábricas | 8,649.77 | -6,169.89 |
| Hoteles | 3,652.79 | -6,523.96 |
| Gasolineras | 56,876.30 | -4,735.69 |
| Logística | 4,379.73 | -4,709.13 |

Son escenarios de prueba con capital de desarrollo explícito, no operaciones insertadas en partidas de jugadores ni promesas de rentabilidad.

## Revisión de navegador

Vista móvil de 390×844 en Chromium: selección de cafetería, catálogo contextual, contratación de gerente gastronómico, nómina actualizada, perfil, autonomía Supervisado, límite por operación, ejecución de compras, informe que separa acciones realizadas de propuestas y organigrama. Se comprobó ausencia de desbordamiento horizontal en el panel (375 px útiles; ancho del documento 375 px). También se ejecutó guardar/recargar/continuar: se conservaron persona, salario, sucursal, autonomía y presupuestos. Filtros plegables: selección de chef, cierre del filtro y tarjeta correcta. Escritorio: organigrama legible y ancho del documento igual al viewport (1348 px).

No se ejecutó una prueba en teléfono Android físico. La revisión responsive no sustituye esa medición.
