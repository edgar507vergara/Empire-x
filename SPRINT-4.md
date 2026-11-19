# EMPIRE X · Sprint 4 · Personas y especialización

Esta ampliación está integrada en el juego existente. No requiere Supabase, Vercel, API de IA ni servidor para GitHub Pages.

## Cómo jugar

1. Abre **Administración → Personas y gerentes**. Selecciona industria, empresa y sucursal; también puedes entrar desde Personal de una sucursal.
2. **Recursos humanos** muestra nómina, motivación, personal mínimo/recomendado, vacantes, productividad y organigrama de departamentos activos. Una cafetería pequeña necesita cocinero y cajero; los demás cargos son inversiones opcionales.
3. En **Talento**, abre **Filtros de candidatos**. Filtra por cargo, departamento, especialización, experiencia, nivel, salario o atributo. Solo aparecen profesiones compatibles con la sede y su variante. Puedes comparar y guardar favoritos. La oferta se renueva semanalmente en tiempo simulado.
4. Contrata personal y gerentes. El costo de incorporación y la nómina se cargan a la sede elegida. El salario considera cargo, sector, habilidades, experiencia, responsabilidad, tamaño y demanda laboral; los contratos existentes conservan su remuneración.
5. En **Gerentes → Gestionar**, define responsabilidades, autonomía, estrategia, presupuesto por operación/día/mes, reserva de caja, riesgo y límites de precios/contratación. Un gerente solo puede recibir permisos propios de su cargo. Solicita análisis e informes y revisa las propuestas en **Decisiones**.
6. Abre **Ver perfil → Traslados, departamentos y carrera** para trasladar, ascender o certificar una nueva función. El traslado liquida obligaciones salariales de origen, mueve a la misma persona e invalida propuestas de su antigua asignación. Los conductores deben terminar su ruta. Cambiar de cargo gerencial reinicia la autonomía en Manual.
7. Los ascensos requieren XP, nivel, liderazgo y habilidad principal, y aumentan el salario. Ejemplos: cajero → supervisor → jefe de tienda → gerente; operario → supervisor → jefe de producción → gerente de planta.
8. La reconversión cuesta 120 USD + 40 USD por nivel de responsabilidad y tarda 5 días + ese nivel. Otorga una certificación, XP sectorial y mejora limitada de habilidad; puede rendir menos de lo previsto. No transfiere automáticamente. La adaptación a un sector nuevo dura 14 días y reduce eficiencia.
9. En **Holding corporativo**, contrata directivos y selecciona explícitamente las empresas que supervisan. El liderazgo limita el número de empresas; cada directivo comparte sus presupuestos entre todas ellas. La nómina corporativa se registra una sola vez en la caja original.
10. Guarda o exporta desde Configuración. En Pages, los datos pertenecen al navegador/dispositivo, sin sincronización en nube. Importar crea una copia; conserva tu JSON anterior para regresar a una versión previa.

## Efectos verificables

| Sector | Ejemplos de efecto real |
|---|---|
| Comercio | Cajeros limitan atención; reposición, ventas e inventario mejoran capacidad y disponibilidad. |
| Restaurantes | Chefs mejoran calidad/capacidad; meseros aumentan servicio; compras y cocina reducen desperdicio. |
| Hoteles | Recepción y limpieza limitan habitaciones atendidas; mantenimiento conserva instalaciones; ingresos ajusta tarifas. |
| Gasolineras | Despachadores limitan servicio; técnicos reducen deterioro; combustibles gestiona compras y margen. |
| Fábricas | Operarios limitan producción; calidad reduce merma en maquinaria deteriorada; planificación mejora tiempos. |
| Logística | Conductores y vehículos limitan rutas; planificación reduce tiempo/combustible; mecánicos reducen desgaste. |
| Holding | CEO coordina; CFO protege reservas; COO supervisa operaciones; CHRO propone cursos y personal. Los permisos distinguen sus cargos. |

Las contribuciones tienen topes: contratar más personal eleva costos sin asegurar ventas ni eliminar límites de maquinaria, inventario, demanda o flota. La experiencia sectorial y la capacitación afectan la compatibilidad; un gerente reconvertido empieza con menor rendimiento que un especialista comparable.

El catálogo incluye banca propia futura, pero no ofrece esas contrataciones mientras no exista esa industria. No modifica el sistema de bancos NPC.

## Guardados anteriores

El esquema 4 agrega industria, especialización, departamento, certificaciones, experiencia sectorial y alcance a los empleados anteriores. Conserva salarios, atributos, experiencia e historial. Antes de migrar se almacena una copia del estado anterior. El formato de exportación conserva su contenedor compatible y contiene el nuevo esquema de estado.
