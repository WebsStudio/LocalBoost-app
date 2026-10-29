// README que se incluye dentro del ZIP exportado. Contenido en texto plano (Markdown).

export function buildExportReadme({ name, files, assetPaths, hasForm, formMode }) {
  const list = [...files, ...assetPaths].map((p) => `- \`${p}\``).join('\n');
  const formNote = !hasForm
    ? 'Esta web no incluye formulario de contacto: los visitantes contactan por teléfono, WhatsApp, correo o los enlaces que hayas configurado.'
    : formMode === 'email'
      ? 'El formulario de contacto **no envía los datos a ningún servidor**: al pulsar “Enviar” se abre el programa de correo del visitante con el mensaje ya escrito, dirigido al correo del negocio. Si quieres recibir mensajes sin que el visitante use su correo, tendrás que conectar un servicio de formularios (por ejemplo Formspree o Formsubmit) y cambiar el `action` del formulario.'
      : 'El formulario de contacto **no envía los datos a ningún servidor**: al pulsar “Enviar” se abre WhatsApp con el mensaje ya escrito. Para recibir mensajes por correo tendrás que conectar un servicio de formularios.';

  return `# ${name} — sitio web estático

Este paquete contiene una web completa, lista para publicar. No necesita servidor, base de datos ni LocalBoost para funcionar: son archivos HTML, CSS y JavaScript normales.

## Archivos incluidos

${list}

## Probarla en tu ordenador

Haz doble clic en \`index.html\`. Se abrirá en tu navegador.

## Publicarla gratis con GitHub Pages

LocalBoost **no publica la web por ti**: generas el ZIP y lo subes tú siguiendo estos pasos.

1. Crea una cuenta en <https://github.com> (gratis) si aún no tienes.
2. Pulsa **New repository**. Ponle un nombre sin espacios (por ejemplo \`web-mi-negocio\`), déjalo en **Public** y créalo.
3. Descomprime este ZIP. En el repositorio, pulsa **Add file → Upload files** y arrastra **el contenido de la carpeta** (\`index.html\`, \`style.css\`, \`script.js\`, la carpeta \`assets\`…). \`index.html\` debe quedar en la raíz del repositorio, no dentro de otra carpeta.
4. Pulsa **Commit changes**.
5. Ve a **Settings → Pages**. En *Build and deployment*, elige **Deploy from a branch**, rama **main** y carpeta **/ (root)**. Guarda.
6. Espera uno o dos minutos. GitHub te mostrará la dirección, con la forma \`https://TU-USUARIO.github.io/NOMBRE-DEL-REPOSITORIO/\`.

Todas las rutas de esta web son relativas, así que funciona igual en esa dirección, en un dominio propio o en cualquier otro alojamiento estático (Netlify, Cloudflare Pages, un hosting tradicional…).

### Dominio propio (opcional)

En **Settings → Pages → Custom domain** puedes indicar un dominio que hayas comprado y seguir las instrucciones de DNS que muestra GitHub.

## Editar el contenido después

- **Textos, precios, horarios:** abre \`index.html\` con cualquier editor de texto y cambia el texto entre las etiquetas.
- **Colores y tipografías:** al principio de \`style.css\`, dentro de \`:root\`, hay variables (\`--primary\`, \`--bg\`, \`--text\`, \`--font-head\`, \`--font-body\`…) que controlan toda la web.
- **Imágenes:** sustituye los archivos de la carpeta \`assets\` por otros **con el mismo nombre**, o cambia la ruta en \`index.html\`.
- Si prefieres no tocar código, vuelve a LocalBoost, abre el proyecto, edítalo y exporta de nuevo.

## Formulario de contacto

${formNote}

## Teléfono, WhatsApp y mapa

Los enlaces de teléfono (\`tel:\`), WhatsApp (\`wa.me\`) y mapa están ya preparados con los datos que introdujiste. Comprueba que los números son correctos antes de publicar.

---

Generado con LocalBoost. La web resultante es tuya y no depende de ninguna herramienta externa.
`;
}
