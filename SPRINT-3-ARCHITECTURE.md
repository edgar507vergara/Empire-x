# Inspección previa y plan de integración

Base inspeccionada: commit `8198244c67c65b446a910090263af8a9e243706e` (Sprint 2). El árbol estaba limpio.

- `simulation/engine.ts`: una tienda, reloj único, transacciones en centavos, partida doble, compras, ventas, salarios y validación. Se conserva; se extrae únicamente el registro contable común para reutilizarlo.
- `management`: candidatos, atributos, presupuestos, propuestas, cursos y evaluación reales. Las referencias estaban fijadas a `retail-1`; se amplían para sucursales y especializaciones.
- `world` y `City`: cuadrícula 20×20 y renderer Phaser con zoom/táctil. Se añaden edificios en parcelas propias sin sustituir el mapa.
- `persistence`: IndexedDB en Pages, migración de HTML anterior, importación/exportación y checksum; servidor opcional existente con D1. Se migra a esquema 3 conservando copias de esquema 1/2.
- `People`, `EmpireGame`: identidad y navegación existentes. Administración agrupa empresas, instalaciones y cadena de suministro; Personas y Decisiones se reutilizan.

El registro de industrias define instalaciones, recetas, capacidades, personal y reglas de demanda. Todas las operaciones usan el mismo libro contable. Los inventarios en tránsito y en producción siguen siendo activos; solo se venden unidades recibidas. Los movimientos internos de mercancía se hacen a costo contable y no se registran como ventas del grupo. Las tarifas de transporte entre empresas se eliminan en el consolidado.

No se agregan proveedores de infraestructura obligatorios. La salida estática continúa funcionando sin servidor, API ni claves.
