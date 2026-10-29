# LocalBoost

Aplicación web **estática y sin dependencias** para crear, personalizar y exportar mini-webs profesionales para negocios locales (peluquerías, restaurantes, talleres de motos, fitness, servicios…).

- 3 plantillas con composición propia: **Atelier** (belleza/bienestar), **Mesa** (restauración), **Garage** (taller/motos).
- Asistente de 5 pasos + editor en vivo con vista previa de ordenador, tableta y móvil.
- Exportación real a **ZIP** (`index.html`, `style.css`, `script.js`, `assets/`, `README.md`).
- Datos en `localStorage` (solo este navegador; **no hay sincronización en la nube**). Copias de seguridad en JSON.
- Sin APIs de pago, sin backend, sin claves en el código.

## Uso en local

No hay que instalar nada. Necesitas un servidor estático (los módulos ES no funcionan con `file://`):

```bash
python3 -m http.server 8080      # o: npx serve .
# abre http://localhost:8080
```

## Publicar LocalBoost en GitHub Pages

1. Sube esta carpeta a un repositorio de GitHub (rama `main`).
2. **Settings → Pages → Deploy from a branch → main / (root)**.
3. La app quedará en `https://USUARIO.github.io/REPOSITORIO/`. Todas las rutas son relativas y el router usa `#/`, así que funciona en subruta.

LocalBoost **no publica las webs de tus clientes**: exportas el ZIP y lo subes tú (el ZIP incluye un README con los pasos).

## Pruebas

```bash
for f in tests/*.test.mjs; do node $f; done     # unitarias (Node ≥ 18, requiere `unzip`)
cd tests/e2e && python3 workflow_test.py        # flujo completo en navegador (Python + Playwright)
python3 mobile_test.py && python3 dashboard_test.py
```

## Estructura

```
index.html · css/app.css
js/main.js            router por hash
js/core/              modelos, saneado, repositorio (localStorage), utilidades
js/generator/         proyecto → web (shared, model, color, templates/*)
js/export/            ZIP propio, exportador, README del export
js/ui/                dashboard, wizard, editor, panels, forms, images, preview…
tests/                unitarias (Node) y e2e (Playwright)
```

## Decisiones técnicas

- **Sin build ni npm**: JS con módulos ES. Más simple de publicar y mantener.
- **Capa de datos** en `js/core/repository.js` con interfaz asíncrona: para añadir un backend basta otra clase con los mismos métodos.
- **Imágenes** comprimidas al subir (máx. 1400 px, origen ≤ 4 MB, 24 por proyecto) para cuidar la cuota de `localStorage`.
- **Formulario de contacto** de las webs generadas: no envía a un servidor; abre un correo o WhatsApp con el mensaje preparado.
- **Reservas**: solo enlaces externos; no hay disponibilidad simulada.
- **Seguridad**: todo texto del usuario se inserta como texto (DOM) o escapado (HTML exportado); la vista previa va en un iframe con `sandbox` sin `allow-same-origin`.

## Modelo de negocio (sin implementar pagos)

Pensado para vender el servicio de creación y mantenimiento de webs, y en el futuro packs de plantillas. No hay botones de suscripción ni cobros falsos.
