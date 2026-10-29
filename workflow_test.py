"""Flujo completo (prompt §10): crear → datos → servicios → plantilla → diseño → guardar →
recargar → reabrir/editar → exportar ZIP → abrir la web exportada de forma independiente
(servida desde un subdirectorio, como en GitHub Pages)."""
import contextlib, subprocess, sys, tempfile, time, zipfile, socket
from pathlib import Path
from playwright.sync_api import sync_playwright
from helpers import static_server, Checker, watch_errors, SHOTS, free_port

c = Checker()
errors = []

with static_server() as base, sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={"width": 1360, "height": 860}, accept_downloads=True)
    page = ctx.new_page()
    watch_errors(page, errors)

    # 1. Crear proyecto
    page.goto(base + "/index.html")
    page.wait_for_selector(".welcome")
    page.click("text=Nuevo proyecto")
    page.fill("dialog input[type=text]", "Taller Motos Sur")
    page.select_option("dialog select", "motor")
    page.click("dialog >> text=Crear y continuar")
    page.wait_for_url("**#/p/*/wizard")
    page.wait_for_selector(".stepper")
    c.ok(page.locator(".stepper li").count() == 5, "asistente con 5 pasos")

    # 2. Validación del paso 1
    page.fill("input[aria-required=true]", "")
    page.click("text=Continuar")
    c.ok(page.locator(".field__error:visible").count() >= 1, "no avanza sin nombre del negocio")
    page.fill("input[aria-required=true]", "Taller Motos Sur")
    page.fill("input[type=email]", "malo")
    page.locator("input[type=email]").blur()
    c.ok(page.locator("input[type=email][aria-invalid=true]").count() == 1, "valida email")
    page.fill("input[type=email]", "hola@tallermotos.es")
    page.get_by_label("Ciudad").fill("Sevilla")
    page.get_by_label("Dirección").fill("Polígono Sur, nave 3")
    page.get_by_label("Teléfono").fill("955 123 456")
    page.get_by_label("WhatsApp").fill("612 345 678")
    page.get_by_label("Instagram").fill("@tallermotossur")
    page.screenshot(path=str(SHOTS / "wiz-1.png"), full_page=True)
    page.click("text=Continuar")

    # 3. Servicios
    page.wait_for_selector(".item")
    n0 = page.locator(".item").count()
    page.click("text=Añadir servicio")
    c.ok(page.locator(".item").count() == n0 + 1, "añade servicio")
    last = page.locator(".item").last
    last.get_by_label("Nombre").fill("Cambio de neumáticos")
    last.get_by_label("Precio").fill("Desde 25 €")
    c.ok(page.locator(".item").first.get_by_label("Subir").is_disabled(), "el primer servicio no se puede subir")
    page.locator(".item").nth(1).get_by_label("Subir").click()
    page.screenshot(path=str(SHOTS / "wiz-2.png"), full_page=True)
    page.click("text=Continuar")

    # 4. Identidad: plantilla y color
    page.wait_for_selector(".template-card")
    page.click(".template-card >> nth=1")  # Mesa
    c.ok(page.locator(".template-card[aria-pressed=true]").count() == 1, "selecciona plantilla")
    page.click(".template-card >> nth=2")  # Garage
    hexes = page.locator(".color-row input[type=text]")
    hexes.first.fill("#2f80ed")
    page.screenshot(path=str(SHOTS / "wiz-3.png"), full_page=True)
    page.click("text=Continuar")

    # 5. Secciones
    page.wait_for_selector(".sections-list")
    c.ok(page.locator(".sec").count() == 9, "9 secciones listadas")
    page.get_by_label("Mostrar sección Opiniones").check()
    page.get_by_label("Bajar Servicios").click()
    page.screenshot(path=str(SHOTS / "wiz-4.png"), full_page=True)
    page.click("text=Continuar")

    # 6. Vista previa
    page.wait_for_selector("iframe.preview-frame")
    page.wait_for_timeout(600)
    fr = page.frame_locator("iframe.preview-frame")
    c.ok(fr.locator("h1").first.inner_text() != "", "la vista previa muestra un titular")
    c.ok("Taller Motos Sur" in page.frame_locator("iframe.preview-frame").locator("body").inner_text(), "nombre del negocio en la vista previa")
    page.click("button[aria-label=Móvil]")
    page.wait_for_timeout(500)
    c.ok(page.locator("iframe.preview-frame").evaluate("e => e.getBoundingClientRect().width") <= 392, "modo móvil estrecha la vista previa")
    page.screenshot(path=str(SHOTS / "wiz-5-mobile.png"), full_page=True)
    page.click("text=Terminar y abrir el editor")
    page.wait_for_url("**/edit")
    page.wait_for_selector(".editor")

    # 7. Persistencia tras recargar
    page.reload()
    page.wait_for_selector(".editor")
    page.wait_for_timeout(500)
    c.ok(page.get_by_label("Ciudad").input_value() == "Sevilla", "los datos persisten tras recargar")
    page.click("#tab-services")
    vals = [i.input_value() for i in page.locator(".item input[type=text]").all()]
    c.ok("Cambio de neumáticos" in vals, "el servicio nuevo persiste")

    # 8. Edición en vivo
    page.click("#tab-business")
    page.get_by_label("Ciudad").fill("Córdoba")
    page.click("#tab-sections")
    page.locator("details[data-sid] summary").first.click()
    page.get_by_label("Titular").fill("Tu moto, en manos expertas")
    page.wait_for_timeout(700)
    c.ok("tu moto, en manos expertas" in page.frame_locator("iframe.preview-frame").locator("body").inner_text().lower(), "la vista previa se actualiza al editar")
    page.click("button:has-text('Guardar')")
    page.wait_for_selector(".toast--success")
    page.screenshot(path=str(SHOTS / "editor.png"))

    # 9. Exportar
    with page.expect_download() as dl:
        page.click("button:has-text('Exportar ZIP')")
        if page.locator("dialog[open]").count():
            page.click("dialog >> text=Exportar igualmente")
    d = dl.value
    out = Path(tempfile.mkdtemp(prefix="lb-e2e-")) / d.suggested_filename
    d.save_as(out)
    c.ok(out.name == "taller-motos-sur-web.zip", f"nombre del ZIP ({out.name})")
    z = zipfile.ZipFile(out)
    names = z.namelist()
    c.ok({"index.html", "style.css", "script.js", "README.md"} <= set(names), f"contiene los archivos base {names}")
    site = Path(tempfile.mkdtemp(prefix="lb-site-")) / "mi-repositorio"
    z.extractall(site)

    # 10. Abrir la web exportada, independiente, bajo subruta
    port = free_port()
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "--directory", str(site.parent)],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.8)
    try:
        site_errors = []
        sp = ctx.new_page()
        watch_errors(sp, site_errors)
        failed = []
        sp.on("requestfailed", lambda r: failed.append(r.url))
        sp.on("response", lambda r: failed.append(r.url) if r.status >= 400 else None)
        sp.goto(f"http://127.0.0.1:{port}/mi-repositorio/index.html")
        sp.wait_for_selector("h1")
        c.ok("córdoba" in sp.inner_text("body").lower(), "la web exportada refleja los últimos cambios")
        c.ok("tu moto, en manos expertas" in sp.inner_text("h1").lower(), "titular editado en la web exportada")
        c.ok(not failed, f"sin recursos rotos en subruta {failed}")
        c.ok(not site_errors, f"sin errores de consola en la web exportada {site_errors}")
        c.ok(sp.locator("a[href^='https://wa.me/34612345678']").count() >= 1, "enlace de WhatsApp correcto")
        c.ok(sp.locator("a[href^='tel:+34955123456']").count() >= 1, "enlace de teléfono correcto")
        sp.screenshot(path=str(SHOTS / "exported-desktop.png"), full_page=True)
        sp.set_viewport_size({"width": 390, "height": 800})
        sp.screenshot(path=str(SHOTS / "exported-mobile.png"), full_page=True)
        c.ok(sp.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"), "sin scroll horizontal en móvil")
    finally:
        srv.terminate()

    # Estado en el dashboard
    page.goto(base + "/index.html#/")
    page.wait_for_selector(".row:not(.row--head)")
    c.ok("Exportado" in page.inner_text(".row:not(.row--head)"), "el dashboard marca el proyecto como Exportado")

    c.ok(not errors, f"sin errores de consola en la app {errors}")
    browser.close()

c.done()
