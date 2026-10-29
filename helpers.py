"""Utilidades para pruebas de navegador (solo desarrollo). Requiere Python + Playwright.

Uso:  python3 tests/e2e/dashboard_test.py
"""
import contextlib
import os
import socket
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SHOTS = Path(os.environ.get("LB_SHOTS", "/tmp/lb-shots"))
SHOTS.mkdir(parents=True, exist_ok=True)


def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@contextlib.contextmanager
def static_server():
    port = free_port()
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "--directory", str(ROOT)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        for _ in range(50):
            with contextlib.suppress(OSError):
                socket.create_connection(("127.0.0.1", port), timeout=0.2).close()
                break
            time.sleep(0.1)
        yield f"http://127.0.0.1:{port}"
    finally:
        proc.terminate()


class Checker:
    def __init__(self):
        self.failed = 0
        self.passed = 0

    def ok(self, cond, label):
        if cond:
            self.passed += 1
            print("  ok  ", label)
        else:
            self.failed += 1
            print("  FAIL", label)

    def done(self):
        print(f"\n{self.passed} OK, {self.failed} fallos")
        sys.exit(1 if self.failed else 0)


def watch_errors(page, bucket):
    page.on("pageerror", lambda e: bucket.append(f"pageerror: {e}"))
    page.on("console", lambda m: bucket.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
