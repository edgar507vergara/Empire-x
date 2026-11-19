# EMPIRE X — Business Empire Simulator

Sprint 4 amplía los Sprints 1, 2 y 3 con cargos y departamentos sectoriales, contratación contextual, reconversión, carreras profesionales y directivos del holding. Conserva empresas, sucursales, cinco industrias, proveedores, producción, flota y contratos. Conserva la identidad Corporate Empire Dark y la ciudad isométrica con controles táctiles.

**GitHub Pages funciona sin servidor, Supabase, Vercel, servicios de IA ni claves API.** Las partidas de Pages se guardan en IndexedDB de ese navegador y dispositivo; no se sincronizan en nube.

- [Guía del Sprint 4 y recursos humanos](SPRINT-4.md)
- [Pruebas del Sprint 4](TESTS-SPRINT-4.md)
- [Arquitectura del Sprint 4](SPRINT-4-ARCHITECTURE.md)
- [Guía del Sprint 3 y reglas económicas](SPRINT-3.md)
- [Publicación en GitHub Pages](GITHUB-PAGES.md)
- [Pruebas ejecutadas y límites de verificación](TESTS-SPRINT-3.md)
- [Inspección de la arquitectura existente](SPRINT-3-ARCHITECTURE.md)
- [Documentación previa del Sprint 2](SPRINT-2.md)

## Jugar

1. Continúa tu partida existente o crea una nueva. La tienda original sigue en **Primera tienda**.
2. Abre **Administración → Mis empresas → Nueva empresa**, selecciona industria y asigna capital desde la caja principal.
3. Pulsa **Expandir**, elige parcela y establecimiento. Reserva efectivo para personal, suministros y gastos.
4. En **Sucursales → Administrar → Personal**, contrata el personal requerido. Talento permite elegir la sucursal que pagará incorporación y salarios.
5. Compra insumos en Proveedores, configura precios y abre operaciones. Las entregas requieren tiempo simulado.
6. Contrata el gerente especializado, configura responsabilidades, autonomía y presupuestos. Revisa sus acciones en **Decisiones**.
7. Usa **Configuración → Exportar partida actual** para conservar una copia portable. La importación crea una partida nueva y no reemplaza las existentes.

## Desarrollo

Node.js 22.13 o posterior (24 recomendado), npm y Git.

```sh
npm ci
npm run typecheck
npm test
npm run build:pages
```

Publica el contenido de `dist-pages/`. En el repositorio GitHub de entrega, `index.html`, `assets/` y `.nojekyll` en la raíz ya contienen la compilación estática. El código fuente está en `src/`; no edites directamente los bundles.

Para desarrollo local estático: `npx vite --config vite.pages.config.ts`, ruta `/pages.html`.

## Arquitectura

- `simulation`: reloj único, tienda original y libro contable común en centavos.
- `enterprise`: registro central, entidades, operaciones, adaptadores de demanda, producción, logística y gerencia.
- `management`: mercado laboral, perfiles, autonomía, límites, capacitación, propuestas, informes y evaluación.
- `workforce`: profesiones, departamentos, compatibilidad, contratación, transferencias, salarios y efectos operativos.
- `persistence`: IndexedDB, validación, checksum y migraciones aditivas 1/2/3 → 4 con copia previa.
- `world` y `City`: ciudad 20×20, selección, arrastre y zoom. Edificios por industria en parcelas exclusivas.
- `Administration`, `People`, `EmpireGame`: interfaz contextual y móvil sobre la navegación existente.
- `server`, `db`, `drizzle`: modalidad alojada opcional ya existente, con identidad y SQLite/D1. No interviene en GitHub Pages.

La modalidad alojada se compila mediante `npm run build`; conserva su configuración e identidad anteriores. Las migraciones SQL 0000–0003 se aplican por orden una sola vez. La salida de servidor no sirve para Pages.

No hay avance offline. Un solo controlador ejecuta la partida. Cada acción persistente tiene referencia de idempotencia; una transacción guarda estado, asientos y eventos juntos. Las pruebas anuales ejercitan el motor puro, no simulan un año de infraestructura remota.
