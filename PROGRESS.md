# LocalBoost — Estado del proyecto

> Este archivo es la fuente de verdad para retomar el trabajo tras una pausa.
> Regla de trabajo acordada: cuando se acaban los tokens se pausa y NO se reanuda hasta que el usuario lo indique.

## Decisiones técnicas (documentadas)

| Decisión | Motivo |
|---|---|
| **Sin dependencias npm** (JS con módulos ES, sin build) | El registro npm está bloqueado por la política de red del entorno de desarrollo (403). El prompt permite elegir "una solución más simple y fiable". Además es más fácil de publicar y mantener. |
| **ZIP propio** (método "store" + CRC32) | Evita JSZip. Los ZIP son válidos y abren en cualquier sistema. |
| **Router por hash** (`#/ruta`) | Funciona en GitHub Pages sin configuración de servidor. |
| **Rutas relativas** en todo | Sin rutas absolutas que rompan en `usuario.github.io/repo/`. |
| **localStorage con repositorio asíncrono** | Se puede cambiar por un backend sustituyendo solo `js/core/repository.js`. |
| **Imágenes comprimidas al subir** (máx. 1400 px, JPEG/WebP, límite 4 MB de origen) | localStorage tiene ~5 MB; hay que cuidar la cuota. |
| **Webs generadas = HTML+CSS+JS puros**, sin dependencias | Independientes de LocalBoost. |

## Estructura de carpetas

```
localboost/
├─ index.html              # shell de la app
├─ css/app.css             # sistema de diseño de la app
├─ js/
│  ├─ main.js              # arranque + router
│  ├─ core/                # modelos, repositorio, utilidades, toasts
│  ├─ ui/                  # dashboard, asistente, editor, modales, iconos
│  ├─ generator/           # generador de webs + plantillas
│  └─ export/              # zip, exportador, README del export
├─ tests/                  # pruebas con Node (sin dependencias)
├─ README.md
└─ PROGRESS.md
```

## Fases

- [x] Fase 1 — Planificación
- [x] Fase 2 — Base: sistema de diseño, dashboard, gestión de proyectos
- [x] Fase 3 — Asistente de 5 pasos, 3 plantillas, editor en vivo
- [x] Fase 4 — Exportación ZIP (+ README del export, avisos previos)
- [x] Fase 5 — QA del flujo completo (e2e 24/24, móvil 6/6, unitarias OK)
- [x] Fase 6 — README de instalación y GitHub Pages

## Pendiente / mejoras posibles

- Revisión visual fina de las 3 plantillas con contenido real e imágenes grandes.
- Pruebas manuales en Safari/Firefox (solo se ha probado Chromium).
- Más plantillas (packs premium) y ajustes de contraste automáticos.

## Registro

- 2026-10-29: arrancado; npm bloqueado → arquitectura sin dependencias.
- 2026-10-29: añadidos wizard, editor, panels, images, preview/autosave, exporter, README y tests e2e. MVP completo.
