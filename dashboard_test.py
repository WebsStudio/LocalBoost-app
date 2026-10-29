import json
from playwright.sync_api import sync_playwright
from helpers import static_server, Checker, watch_errors, SHOTS

c = Checker()
errors = []

with static_server() as base, sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={"width": 1360, "height": 860}, accept_downloads=True)
    page = ctx.new_page()
    watch_errors(page, errors)

    page.goto(base + "/index.html")
    page.wait_for_selector(".welcome")
    c.ok(page.locator(".empty h2").inner_text() == "Aún no tienes proyectos", "estado vacío visible")
    page.screenshot(path=str(SHOTS / "dash-empty.png"))

    # Crear proyecto con validación
    page.click("text=Nuevo proyecto")
    page.click("dialog >> text=Crear y continuar")
    c.ok(page.locator("dialog .field__error").is_visible(), "valida nombre vacío")
    page.fill("dialog input[type=text]", "Peluquería Aurora")
    page.select_option("dialog select", "beauty")
    page.click("dialog >> text=Crear y continuar")
    page.wait_for_url("**#/p/*/wizard")
    c.ok(True, "tras crear navega al asistente")

    # Persistencia tras recarga
    page.goto(base + "/index.html#/")
    page.reload()
    page.wait_for_selector(".row:not(.row--head)")
    c.ok(page.locator(".row:not(.row--head)").count() == 1, "el proyecto persiste tras recargar")

    # Demo, filtros, renombrar, duplicar
    page.goto(base + "/index.html#/")
    page.wait_for_selector(".row:not(.row--head)")
    page.click("text=Nuevo proyecto")
    page.fill("dialog input[type=text]", "Taller Motos Sur")
    page.select_option("dialog select", "motor")
    page.click("dialog >> text=Crear y continuar")
    page.wait_for_url("**#/p/*/wizard")
    page.goto(base + "/index.html#/")
    page.wait_for_selector(".row:not(.row--head)")
    c.ok(page.locator(".row:not(.row--head)").count() == 2, "dos proyectos")
    page.fill("input[type=search]", "taller")
    c.ok(page.locator(".row:not(.row--head)").count() == 1, "búsqueda filtra")
    page.fill("input[type=search]", "zzz")
    c.ok(page.locator(".empty h2").inner_text() == "Ningún proyecto coincide", "sin resultados")
    page.click("text=Quitar filtros")
    page.click(".chip:has-text('Taller de motos')")
    c.ok(page.locator(".row:not(.row--head)").count() == 1, "filtro por categoría")
    page.click(".chip:has-text('Todas')")

    page.click("button[aria-label^='Renombrar Taller']")
    page.fill("dialog input", "Taller Renombrado")
    page.click("dialog >> text=Guardar")
    page.wait_for_selector("text=Taller Renombrado")
    c.ok(True, "renombrar")

    page.click("button[aria-label^='Duplicar Taller Renombrado']")
    page.wait_for_selector("text=Taller Renombrado (copia)")
    c.ok(page.locator(".row:not(.row--head)").count() == 3, "duplicar")

    # Eliminar con confirmación (cancelar y confirmar)
    page.click("button[aria-label^='Eliminar Taller Renombrado (copia)']")
    page.click("dialog >> text=Cancelar")
    c.ok(page.locator(".row:not(.row--head)").count() == 3, "cancelar no borra")
    page.click("button[aria-label^='Eliminar Taller Renombrado (copia)']")
    page.click("dialog >> text=Eliminar proyecto")
    page.wait_for_function("document.querySelectorAll('.row:not(.row--head)').length === 2")
    c.ok(True, "eliminar con confirmación")
    page.screenshot(path=str(SHOTS / "dash-list.png"))

    # Datos y copias
    page.click("a[href='#/data']")
    page.wait_for_selector("text=Datos y copias de seguridad")
    with page.expect_download() as dl:
        page.click("text=Descargar copia")
    path = dl.value.path()
    backup = json.load(open(path, encoding="utf-8"))
    c.ok(backup["app"] == "LocalBoost" and len(backup["projects"]) == 2, "copia de seguridad descargada con 2 proyectos")
    page.screenshot(path=str(SHOTS / "data.png"))

    # Móvil
    page.set_viewport_size({"width": 390, "height": 800})
    page.goto(base + "/index.html#/")
    page.wait_for_selector(".row:not(.row--head)")
    overflow = page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
    c.ok(not overflow, "sin scroll horizontal en móvil")
    page.screenshot(path=str(SHOTS / "dash-mobile.png"))

    browser.close()

# Los errores esperados mientras faltan módulos (wizard/editor) se filtran por nombre.
real = [e for e in errors if "wizard.js" not in e and "editor.js" not in e and "Failed to load resource" not in e]
c.ok(not real, f"sin errores de consola inesperados {real[:3]}")
c.done()
