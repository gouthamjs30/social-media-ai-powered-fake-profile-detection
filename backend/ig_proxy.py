"""
Instagram Local Proxy — run this on your Windows host (outside Docker).

Docker containers can reach your machine at host.docker.internal, so this proxy
receives requests from the backend container and makes Instagram API calls using
your local machine's residential IP (which is NOT blocked by Instagram).

Usage:
    python backend/ig_proxy.py

Then in docker-compose.yml set:
    INSTAGRAM_PROXY_URL=http://host.docker.internal:9090

The proxy reads credentials from INSTAGRAM_USERNAME / INSTAGRAM_PASSWORD
environment variables, or falls back to the saved session file.
"""

import os
import sys
import json
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

try:
    from instagrapi import Client
except ImportError:
    print("ERROR: instagrapi not installed. Run: pip install instagrapi Pillow")
    sys.exit(1)

SESSION_FILE = os.path.join(os.path.dirname(__file__), "ig_session.json")
INSTAGRAM_USERNAME = os.getenv("INSTAGRAM_USERNAME", "")
INSTAGRAM_PASSWORD = os.getenv("INSTAGRAM_PASSWORD", "")

_client = None
_client_lock = threading.Lock()


def get_client() -> Client:
    global _client
    if _client is not None:
        return _client
    with _client_lock:
        if _client is not None:
            return _client
        c = Client()
        c.delay_range = [1, 2]

        # Try loading saved session first
        if os.path.exists(SESSION_FILE):
            try:
                c.load_settings(SESSION_FILE)
                if c.user_id:
                    print(f"[ig_proxy] Loaded saved session (user_id={c.user_id})")
                    _client = c
                    return _client
            except Exception as e:
                print(f"[ig_proxy] Saved session invalid: {e}")
                c = Client()
                c.delay_range = [1, 2]

        # Fresh login
        print(f"[ig_proxy] Logging in as @{INSTAGRAM_USERNAME} ...")
        c.login(INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD)
        c.dump_settings(SESSION_FILE)
        print(f"[ig_proxy] Logged in — session saved to {SESSION_FILE}")
        _client = c
    return _client


class ProxyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        username = (params.get("username") or [""])[0].strip().lstrip("@")

        if not username:
            self._respond(400, {"error": "username parameter required"})
            return

        try:
            cl = get_client()
            user = cl.user_info_by_username(username)
            self._respond(200, {
                "username":        user.username,
                "full_name":       user.full_name or "",
                "biography":       user.biography or "",
                "follower_count":  user.follower_count,
                "following_count": user.following_count,
                "media_count":     user.media_count,
                "profile_pic_url": str(user.profile_pic_url) if user.profile_pic_url else None,
                "is_private":      user.is_private,
                "is_verified":     user.is_verified,
            })
        except Exception as exc:
            err = str(exc)
            status = 404 if ("not found" in err.lower() or "user not found" in err.lower()) else 500
            self._respond(status, {"error": err})

    def _respond(self, status: int, data: dict):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        print(f"[ig_proxy] {self.address_string()} {fmt % args}")


if __name__ == "__main__":
    port = int(os.getenv("IG_PROXY_PORT", "9090"))
    print(f"Starting Instagram proxy on port {port} ...")
    print(f"Docker backend should set: INSTAGRAM_PROXY_URL=http://host.docker.internal:{port}")
    # Warm up the client at startup
    try:
        get_client()
    except Exception as e:
        print(f"WARNING: Could not authenticate at startup: {e}")
    server = HTTPServer(("0.0.0.0", port), ProxyHandler)
    print(f"Proxy ready — Ctrl+C to stop\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nProxy stopped.")
