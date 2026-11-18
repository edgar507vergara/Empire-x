# EMPIRE X · Sprint 2

## Qué cambia

Se amplía el juego existente, conservando ciudad Phaser, parcelas, construcción, catálogo, motor económico, diez objetivos, velocidades y pausa. La interfaz Corporate Empire Dark incorpora Personas (Recursos humanos, Talento, Gerentes, Capacitación), Centro de decisiones y avisos.

- Empleados: doce habilidades, edad ficticia, personalidad, experiencia, nivel, contratación, empresa, expectativas salariales y causas de desmotivación.
- Mercado: catorce candidatos nuevos por semana simulada, además del plantel original; filtros, salario, experiencia, favoritos, descarte y comparación de hasta tres perfiles. Los favoritos vencidos permanecen en el historial.
- Seis cargos gerenciales: general, operaciones, comercial, financiero, recursos humanos e inventario. El jugador puede delegar varias áreas a una sola persona.
- Decisiones calculadas cada seis horas simuladas y a petición: compras, precios, contratación, capacitación y restricciones de compras por liquidez. Datos, estimaciones, permisos, ejecución y evaluación quedan registrados.
- Autonomía manual, supervisada y autónoma. La supervisada escala compras mayores a la mitad del límite individual, contrataciones y cursos. Siempre se validan presupuesto individual/diario/mensual, reserva, riesgo, rango de precio, límite mensual de contrataciones y almacén. La aprobación manual también valida los límites.
- Seis estrategias comerciales. Los precios se comparan con la referencia de mercado, sin aumentos acumulativos fuera del rango. Un descuento puede disminuir la utilidad.
- Motivación y estrés dependen del salario esperado, atrasos, carga de trabajo y supervisión. Las renuncias requieren varios días de causas documentadas; no son sorteos arbitrarios.
- Seis cursos: costo contable real, duración simulada, requisitos, disminución temporal de capacidad y mejora con rendimientos decrecientes. Existe una posibilidad determinista de resultado inferior al esperado.
- Ascensos con requisitos y aumento salarial. Eventos de personal con causas, decisiones y separación temporal. Informes distinguen propuestas de acciones realizadas.
- Evaluación semanal con capacidad, presupuesto, rotación, faltantes, productividad, satisfacción y utilidad contextual. Las comparaciones son observacionales, no pruebas de causalidad. El aprendizaje ajusta la cobertura de compras dentro de límites reducidos.

## Primer gerente

1. Construye la tienda y contrata un cajero como en Sprint 1.
2. Personas → Talento → Cargo → Gerente de inventario y compras. Revisa perfil y contrata.
3. Personas → Gerentes → Gestionar. Asigna la empresa.
4. Define autonomía, responsabilidades, estrategia y presupuestos; pulsa Guardar permisos.
5. Analizar ahora genera propuestas. En modo manual revisa Centro de decisiones: aprobar, rechazar, posponer o ajustar cantidad/precio.
6. Abre la tienda y avanza el reloj para evaluar ventas, reposiciones y resultados. El análisis periódico ocurre cada seis horas simuladas; cambiar autonomía no ejecuta retroactivamente una propuesta de inmediato.
7. Solicita un informe o consulta historial. Capacita desde el perfil o el área Capacitación.

No se necesitan todos los gerentes en una tienda. La nómina adicional puede hacerla menos rentable. Las recomendaciones no garantizan ganancias y no pueden pedir préstamos, vender empresas ni transferir fondos externos.

## Arquitectura y contabilidad

`src/modules/management` observa el estado real e invoca las operaciones del motor existente mediante un adaptador. Las compras gerenciales usan `buy_stock`, los precios `set_price`, las contrataciones `hire`; los cursos usan el mismo registro contable de gastos. El planificador no acredita ingresos proyectados.

Se añade `hr_control_costs`: el financiero puede proponer elevar la reserva del encargado de compras y priorizar liquidez. Solo restringe autorizaciones; no crea ahorros contables ni mueve dinero.

Los diarios de ventas por producto contienen ventas y faltantes observados. Cuando falta historia, la propuesta identifica explícitamente que usa la demanda inicial del simulador. No se presentan estimaciones como ventas ocurridas.

La decisión conserva un identificador y estado irreversible de ejecución. Los comandos también tienen una referencia idempotente. Todo se confirma atómicamente con el estado, inventario y asientos. Los registros completos se conservan en `management_journal` (servidor) o `journal` (IndexedDB); la pantalla usa ventanas acotadas para no crecer indefinidamente. Configuración permite exportar el historial.

## Partidas y migraciones

El estado pasa a `schemaVersion: 2`. La migración es aditiva y determinista. No altera dinero, inventario ni reloj del Sprint 1 del proyecto actual. La lectura del servidor crea un respaldo inmutable dentro de la misma transacción antes de guardar el estado migrado. Se añade únicamente `0002_management.sql`; no se modifican las migraciones aplicadas.

La edición GitHub Pages comparte componentes y motor. Solo cambia el adaptador de persistencia: IndexedDB transaccional en el navegador, con diarios separados para no reescribir toda la historia en cada latido. No utiliza cuentas, API, servicios de pago ni sincronización en nube. El control entre pestañas conserva la concesión del motor.

El anterior `index.html` guarda con la clave `empire-x-local-v1`. En el mismo origen y navegador se detecta y copia automáticamente sin borrar la clave original. También se admite su JSON mediante Importar. El adaptador conserva parcela, personal, salarios, caja, precios, unidades y reportes disponibles. El nuevo motor del proyecto actual sigue rigiendo las operaciones futuras. La edición antigua tenía reglas económicas distintas; no se inventa historial por producto ni horas detalladas que no registraba. Un saldo negativo antiguo se conserva como deuda trasladada, con caja cero y negocio cerrado.

Configuración → Exportar partida genera JSON con checksum de integridad. Importar crea otra partida, valida estructura y balance y deja el reloj pausado. El libro de la copia comienza con un asiento explícito de saldos trasladados (sin venta, compra ni flujo ficticio). La exportación del estado incluye el historial reciente; exporta además el historial gerencial si necesitas su archivo completo. El checksum detecta corrupción accidental: no es una firma anti-trampas.

Las partidas locales pertenecen al navegador/dispositivo/origen. No se sincronizan con la edición alojada; usa exportación/importación para trasladarlas. Cambiar dominio no permite leer automáticamente los datos del origen anterior. Conserva un respaldo JSON.

## Validación ejecutada

41 pruebas automatizadas aprobadas; detalle en `test-results-sprint2.txt`. Incluyen las 22 regresiones del Sprint 1 y 19 casos de gerencia, personal, migración y persistencia:

- Contratar y asignar; autonomía; propuestas manuales; aprobación, rechazo, aplazamiento y modificación; ausencia de ejecución doble.
- Compras reales, límites de presupuesto/riesgo/reserva/almacén, autorización vigente y prohibición de acciones no soportadas.
- Cambios de precio, salarios, cursos, ascensos, renuncia causal, personalidad, informes y evaluación.
- Migración aditiva, respaldo SQL exacto y único, importación de la edición HTML, checksum, integridad y copia sin nuevas operaciones ficticias.
- Diario gerencial y contabilidad en una transacción; reintentos idempotentes y aislamiento entre propietarios.
- 365 días activos: 525,600 ciclos, conciliación diaria de todos los asientos, más de 90,000 unidades vendidas y más de 700 reposiciones en la semilla de prueba. Entre aproximadamente 5 y 8 segundos en el ejecutor, incluyendo validaciones; no es un benchmark de Android.
- TypeScript y compilación de ambas salidas.

Prueba interactiva en navegador: crear, comprar parcela, construir, contratar gerente, asignar, configurar presupuestos, generar propuesta, aprobar compra de 303 bebidas por $378.75, comprobar caja, continuar partida, cambiar autonomía y pedir informe. El informe distingue la compra ejecutada de las tres propuestas pendientes.

Revisión a 390 px: navegación agrupada, tarjetas y formulario gerencial sin desbordamiento horizontal (ancho útil 375 px = ancho desplazable 375 px). Falta medir rendimiento en un dispositivo Android físico. La prueba visual usa Chrome con un área móvil; no equivale a probar el teléfono del usuario.

## Publicación

Consulta `GITHUB-PAGES.md`. La edición alojada conserva su identidad y acceso privado. La compilación Pages contiene todo el juego estático y no requiere servicios de backend.

El Sprint 3 puede ampliar industrias y proveedores mediante nuevos roles, responsabilidades y acciones. Por ahora hay una empresa minorista y ocho plazas totales; no se agregan sucursales, préstamos ni logística.
