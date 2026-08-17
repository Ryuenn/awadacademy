#!/usr/bin/env python3
"""Local preview server that matches how Vercel serves this site.

Live Server can't preview this site any more: the pages link to /aboutus, but the
file on disk is aboutus.html, so Live Server 404s on every link. This server
applies the same two rules vercel.json turns on, so what you see locally is what
production does.

  cleanUrls: true      /aboutus     serves aboutus.html
                       /aboutus.html  308-redirects to /aboutus
                       /index.html    308-redirects to /
  trailingSlash: false /aboutus/    308-redirects to /aboutus

Usage:
    python tools/serve.py                 # http://127.0.0.1:3000, opens a browser
    python tools/serve.py --port 8080
    python tools/serve.py --no-open
    python tools/serve.py --mock-api      # fake a success from POST /api/contact

Nothing to install — standard library only.
"""

import argparse
import http.server
import json
import mimetypes
import os
import posixpath
import socketserver
import sys
import threading
import urllib.parse
import webbrowser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Windows reads MIME types out of the registry, where a stray entry can hand back
# text/plain for .js or .css and silently break the whole page. Pin the ones the
# site actually serves.
MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".xml": "application/xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".pdf": "application/pdf",
}

# The contact form posts here. It's a Vercel Function (Node), which this static
# server can't execute, so answer in the JSON shape the form expects instead of
# letting it choke on a 404 HTML page.
API_PATH = "/api/contact"
API_UNAVAILABLE = (
    "The contact form needs the Vercel Function, which this local preview "
    "doesn't run. Use `vercel dev`, or start this server with --mock-api."
)

MOCK_API = False


def routes():
    """Clean URLs for every page at the project root, homepage first."""
    names = sorted(
        f[:-5] for f in os.listdir(ROOT)
        if f.endswith(".html")
        and os.path.isfile(os.path.join(ROOT, f))
        # Search Console's verification file is not a page.
        and not f.startswith("google")
    )
    out = []
    if "index" in names:
        out.append("/")
        names.remove("index")
    out.extend("/" + n for n in names)
    return out


class Handler(http.server.BaseHTTPRequestHandler):
    server_version = "AwadAcademyDev"
    protocol_version = "HTTP/1.1"

    # ---- logging -------------------------------------------------------
    def log_message(self, fmt, *args):
        pass  # replaced by explicit logging in _send/_redirect

    def _log(self, status, note=""):
        sys.stdout.write(
            "  %s %-4s %s%s\n" % (status, self.command, self.path, note)
        )
        sys.stdout.flush()

    # ---- responses -----------------------------------------------------
    def _redirect(self, location):
        self.send_response(308)
        self.send_header("Location", location)
        self.send_header("Content-Length", "0")
        self.end_headers()
        self._log(308, "  ->  " + location)

    def _send(self, status, body, ctype, extra=None):
        if isinstance(body, str):
            body = body.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        # Always revalidate, or you end up debugging a cached copy of the page.
        self.send_header("Cache-Control", "no-store, must-revalidate")
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)
        self._log(status)

    def _json(self, status, payload):
        self._send(status, json.dumps(payload), "application/json; charset=utf-8")

    def _not_found(self, path):
        links = "".join(
            '<li><a href="%s">%s</a></li>' % (r, r) for r in routes()
        )
        html = (
            "<!doctype html><meta charset=utf-8>"
            "<title>404 - not found</title>"
            "<style>body{font:16px/1.6 system-ui,sans-serif;max-width:42rem;"
            "margin:4rem auto;padding:0 1.5rem;color:#111}code{background:#f2f2f2;"
            "padding:.15em .4em;border-radius:4px}ul{padding-left:1.2rem}"
            "a{color:#0b57d0}</style>"
            "<h1>404 &mdash; not found</h1>"
            "<p>Nothing is served at <code>%s</code>.</p>"
            "<p>Pages on this site:</p><ul>%s</ul>"
        ) % (urllib.parse.quote(path), links)
        self._send(404, html, "text/html; charset=utf-8")

    # ---- path resolution ----------------------------------------------
    def _resolve(self, path):
        """Map a URL path to a file on disk, or None. Mirrors Vercel's lookup."""
        rel = urllib.parse.unquote(path).lstrip("/")
        # Refuse anything that climbs out of the project directory.
        target = os.path.normpath(os.path.join(ROOT, rel.replace("/", os.sep)))
        if target != ROOT and not target.startswith(ROOT + os.sep):
            return None
        if path == "/":
            candidate = os.path.join(ROOT, "index.html")
            return candidate if os.path.isfile(candidate) else None
        for candidate in (target, target + ".html", os.path.join(target, "index.html")):
            if os.path.isfile(candidate):
                return candidate
        return None

    # ---- verbs ---------------------------------------------------------
    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        path = posixpath.normpath(path) if path != "/" else "/"

        if path == API_PATH:
            # Same answer the real function gives a non-POST.
            return self._json(405, {"ok": False, "error": "Method not allowed."})

        # cleanUrls: strip .html and tell the client to use the clean path.
        if path.endswith(".html"):
            stem = path[: -len(".html")]
            return self._redirect("/" if stem == "/index" else stem)

        # trailingSlash: false
        if path != "/" and self.path.split("?")[0].endswith("/"):
            return self._redirect(path.rstrip("/") or "/")

        fs_path = self._resolve(path)
        if not fs_path:
            return self._not_found(path)

        ext = os.path.splitext(fs_path)[1].lower()
        ctype = MIME.get(ext) or mimetypes.guess_type(fs_path)[0] or "application/octet-stream"
        try:
            with open(fs_path, "rb") as fh:
                data = fh.read()
        except OSError:
            return self._not_found(path)
        self._send(200, data, ctype)

    def do_HEAD(self):
        self.do_GET()  # _send omits the body for HEAD

    def do_POST(self):
        path = urllib.parse.urlparse(self.path).path
        if path != API_PATH:
            return self._not_found(path)

        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b""
        try:
            payload = json.loads(raw.decode("utf-8")) if raw else {}
        except (ValueError, UnicodeDecodeError):
            payload = None

        if not MOCK_API:
            return self._json(503, {"ok": False, "error": API_UNAVAILABLE})

        sys.stdout.write("  --- mock %s received ---\n" % API_PATH)
        sys.stdout.write("  %s\n" % json.dumps(payload, indent=2, ensure_ascii=False))
        sys.stdout.flush()
        self._json(200, {"ok": True})

    def handle_one_request(self):
        # Browsers cancel in-flight image requests constantly; don't dump a
        # traceback every time one is dropped.
        try:
            super().handle_one_request()
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            self.close_connection = True


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def main():
    global MOCK_API
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--port", type=int, default=3000, help="port (default 3000)")
    ap.add_argument("--host", default="127.0.0.1", help="bind address (default 127.0.0.1)")
    ap.add_argument("--no-open", action="store_true", help="don't open a browser")
    ap.add_argument("--mock-api", action="store_true",
                    help="answer POST /api/contact with {ok:true} to preview the success state")
    args = ap.parse_args()
    MOCK_API = args.mock_api

    try:
        srv = Server((args.host, args.port), Handler)
    except OSError as e:
        sys.exit("Could not bind %s:%d - %s\nTry: python tools/serve.py --port %d"
                 % (args.host, args.port, e, args.port + 1))

    base = "http://%s:%d" % (args.host, args.port)
    print("\n  Awad Academy - local preview (Vercel cleanUrls behaviour)")
    print("  Serving %s" % ROOT)
    print("  %s\n" % base)
    print("  Pages:")
    for r in routes():
        print("    %s%s" % (base, r))
    if MOCK_API:
        print("\n  POST %s -> mocked {ok:true}" % API_PATH)
    print("\n  Old .html URLs 308-redirect to the clean path, exactly like production.")
    print("  Ctrl+C to stop.\n", flush=True)

    if not args.no_open:
        threading.Timer(0.4, lambda: webbrowser.open(base)).start()

    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n  Stopped.")
        srv.shutdown()


if __name__ == "__main__":
    main()
