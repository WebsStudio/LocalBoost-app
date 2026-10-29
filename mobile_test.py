"""Editor y asistente en móvil (390 px): sin scroll horizontal y con cambio editar/vista previa."""
from playwright.sync_api import sync_playwright
from helpers import static_server, Checker, watch_errors, SHOTS
c = Checker(); errors = []
with static_server() as base, sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 390, "height": 800}); watch_errors(pg, errors)
    pg.goto(base + "/index.html"); pg.wait_for_selector(".welcome")
    pg.click("text=Nuevo proyecto"); pg.fill("dialog input[type=text]", "Bar Móvil"); pg.select_option("dialog select", "restaurant")
    pg.click("dialog >> text=Crear y continuar"); pg.wait_for_selector(".stepper")
    c.ok(pg.evaluate("document.documentElement.scrollWidth <= innerWidth+1"), "asistente sin scroll horizontal")
    pg.goto(base + "/index.html#/"); pg.wait_for_selector(".row:not(.row--head)")
    c.ok(pg.evaluate("document.documentElement.scrollWidth <= innerWidth+1"), "dashboard sin scroll horizontal")
    pg.click(".row__actions a[aria-label^='Abrir editor']"); pg.wait_for_selector(".editor")
    c.ok(pg.evaluate("document.documentElement.scrollWidth <= innerWidth+1"), "editor sin scroll horizontal")
    pg.screenshot(path=str(SHOTS / "m-editor.png"))
    pg.click(".editor__top .mobile-switch"); pg.wait_for_selector("iframe.preview-frame", state="visible")
    c.ok(pg.locator(".editor__panel").is_hidden(), "vista previa a pantalla completa en móvil")
    pg.screenshot(path=str(SHOTS / "m-preview.png"))
    pg.click(".editor__stagebar .mobile-switch"); c.ok(pg.locator(".editor__panel").is_visible(), "vuelve a editar")
    c.ok(not errors, f"sin errores {errors}")
c.done()
