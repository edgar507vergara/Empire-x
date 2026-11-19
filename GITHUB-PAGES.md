# Publicar EMPIRE X Sprint 4 en tu GitHub Pages existente

La carpeta `github-pages/` del ZIP de entrega contiene el juego listo: `index.html`, `assets/` y `.nojekyll`. Es la compilación del mismo motor y la misma interfaz del proyecto. No requiere Supabase, Vercel, servidor, claves API ni pagos.

## Desde el celular

1. Exporta tu partida actual desde su configuración y conserva el JSON.
2. Descomprime el ZIP. Abre el repositorio de EMPIRE X que ya usabas; no necesitas otro repositorio.
3. Sustituye el `index.html` publicado por `github-pages/index.html` y sube la carpeta `github-pages/assets/` completa. Conserva la estructura: `index.html` y `assets/` deben quedar juntos. No subas únicamente el HTML ni el ZIP cerrado.
4. Conserva `.nojekyll` en esa misma carpeta. No borres archivos ajenos al juego.
5. En **Settings → Pages → Build and deployment**, selecciona **Deploy from a branch**, la rama que usas y **/(root)** si los archivos están en la raíz; si publicas desde `docs/`, coloca todos esos archivos dentro de `docs/` y selecciona **/docs**. Pulsa **Save**.
6. Espera a que termine el despliegue en **Actions** y abre la dirección que muestra GitHub Pages. Recarga una vez si ves la versión anterior.

El repositorio `edgar507vergara/Empire-x` conserva los commits anteriores. Los archivos estáticos de la raíz se pueden publicar desde `main` y `/(root)`.

Al mantener el mismo dominio y navegador, el juego detecta el guardado local antiguo y crea una copia migrada; conserva el original. Si no aparece, usa Configuración → Importar respaldo JSON. Los datos permanecen en ese navegador y dispositivo; no hay sincronización en nube. Exporta respaldos periódicos.

## Si tienes el código fuente

Con Node.js 22.13 o posterior:

```sh
npm ci
npm run typecheck
npm test
npm run build:pages
```

Publica **el contenido** de `dist-pages/` en la carpeta configurada para Pages. No publiques la salida del servidor `dist/server/`. Las rutas de recursos son relativas, por lo que también funcionan bajo la carpeta del repositorio.

Para desarrollo local de esta salida:

```sh
npx vite --config vite.pages.config.ts
```

Abre `/pages.html` en la dirección que indique Vite. Las partidas de localhost pertenecen a ese origen. Para trasladarlas a tu web, expórtalas e impórtalas allí.

## Si aparece 404 o una página vacía

Comprueba que `index.html` está en la raíz de publicación seleccionada, que `assets/` está a su lado y que el despliegue en Actions terminó correctamente. No abras el HTML mediante `file://`; este juego usa módulos JavaScript que deben servirse mediante HTTP(S).

Referencia oficial: [Configurar el origen de publicación de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
