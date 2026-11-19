# Sprint 4 · Inspección e integración

## Base conservada

Se inspeccionó la implementación recuperada del Sprint 3 antes de editar: React/TypeScript, Phaser, reloj único por minuto, adaptadores de industria por hora, contabilidad en centavos y partida versionada. El punto de partida es el commit de fuente `767909cd59df2f56630dafecefe82ac6d4b895b6`.

- `simulation`: tienda original, reloj, comandos atómicos y validación de balances.
- `enterprise`: empresas/sucursales, proveedores, producción, transporte, demanda y decisiones sectoriales.
- `management`: atributos, motivación, mercado, autonomía, presupuestos, decisiones, informes y cursos.
- `persistence`: IndexedDB para Pages, importación/exportación con checksum y respaldo previo a migración.
- `server`/`db`: modalidad alojada opcional; transacciones SQLite/D1 y control de propietario.
- `People` y `Administration`: recursos humanos y selección contextual de empresa.

## Cambios necesarios

Se añadió `workforce`, que amplía las personas existentes; no mantiene otra lista de empleados ni otro motor financiero. `catalog` define cargos/departamentos/efectos/permisos; `model` calcula compatibilidad, salarios y necesidades; `runtime` ejecuta contratación, transferencia, ascenso y reconversión; `schema` valida sus datos.

Todos los accesos de contratación y asignación pasan por la misma comprobación profesional, incluidos los comandos antiguos y las propuestas IA. Las compras, cursos, nóminas, mantenimiento y transferencias siguen utilizando el libro contable central y las cuentas existentes. No se reconoce ingreso por mejorar un atributo o por proponer una acción.

Las operaciones de industria consultan efectos acotados de su plantilla. Los gerentes conservan el motor de autonomía anterior, ampliado con permisos propios de cada profesión y alcance corporativo explícito. Cada directivo mantiene un único presupuesto diario/mensual conjunto, aunque supervise varias empresas.

El esquema de partida pasa a 4. La migración agrega la carrera profesional sin cambiar el cargo base, el salario, los atributos, la XP ni el historial anterior. El indicador `legacy` conserva asignaciones y permisos ya contratados; los candidatos nuevos siguen las reglas sectoriales. IndexedDB y el servidor respaldan el estado anterior antes de reemplazarlo. Las bases anteriores no se borran.

## Límites de alcance

Esta entrega implementa las secciones 28–41 solicitadas para Sprint 4. No incorpora sistemas bancarios nuevos: el catálogo de personal bancario permanece consultable y reservado para bancos propios futuros. Los bancos NPC de préstamos siguen separados. El holding es un ámbito administrativo del mismo grupo, no una aplicación o compañía duplicada; su nómina se paga una sola vez desde la caja original.
