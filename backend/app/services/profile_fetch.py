"""
Instagram Profile Fetch Service — MAYAJAL

Provider order:
  1. instagrapi  — PRIMARY. Uses Instagram's private mobile API which is NOT
                   blocked by server/Docker IPs. Requires INSTAGRAM_USERNAME +
                   INSTAGRAM_PASSWORD env vars. Session is cached in-process
                   and reused across requests (login happens once on startup).
  2. Direct Instagram web API (httpx) — fast; returns 429 on server IPs but
                   completes in < 1 s so adds no delay.
  3. RapidAPI    — optional; only used when RAPIDAPI_KEY is set.
                   Supported hosts (add subscription on rapidapi.com to enable):
                     • instagram-scraper-api2.p.rapidapi.com  (recommended free tier)
                     • instagram-profile.p.rapidapi.com       (subscribed; provider broken)

Environment variables:
  INSTAGRAM_USERNAME  —  Instagram account for authenticated instagrapi fetches
  INSTAGRAM_PASSWORD  —  Password for the above account
  RAPIDAPI_KEY        —  RapidAPI key (tried against all known profile APIs)
"""

import os
import base64
import threading
from typing import Optional, Dict

import httpx


# ── Instagram request headers (mimic Chrome browser) ────────────────────────

_IG_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept":           "application/json, */*",
    "Accept-Language":  "en-US,en;q=0.9",
    "X-IG-App-ID":      "936619743392459",
    "X-Requested-With": "XMLHttpRequest",
    "Referer":          "https://www.instagram.com/",
    "Origin":           "https://www.instagram.com",
}


# ── Helpers ──────────────────────────────────────────────────────────────────

def _platform_url(platform: str, username: str) -> str:
    return {
        "instagram": f"https://www.instagram.com/{username}/",
        "facebook":  f"https://www.facebook.com/{username}",
        "twitter":   f"https://twitter.com/{username}",
        "linkedin":  f"https://www.linkedin.com/in/{username}/",
        "telegram":  f"https://t.me/{username}",
    }.get(platform, f"https://{platform}.com/{username}")


def _proxy_image(url: str) -> Optional[str]:
    """Download CDN image → base64 data URL so browser can render it."""
    if not url:
        return None
    try:
        r = httpx.get(
            url,
            headers={
                "User-Agent": _IG_HEADERS["User-Agent"],
                "Referer":    "https://www.instagram.com/",
            },
            timeout=8.0,
            follow_redirects=True,
        )
        if r.status_code == 200 and len(r.content) > 500:
            ct = r.headers.get("content-type", "image/jpeg").split(";")[0].strip()
            return f"data:{ct};base64,{base64.b64encode(r.content).decode()}"
    except Exception as exc:
        print(f"[profile_fetch] image proxy error: {exc}")
    return None


def _error(username: str, platform: str, message: str) -> Dict:
    return {
        "username":          username,
        "display_name":      None,
        "bio":               None,
        "profile_url":       _platform_url(platform, username),
        "follower_count":    None,
        "following_count":   None,
        "post_count":        None,
        "account_age_days":  None,
        "profile_image_url": None,
        "is_private":        False,
        "is_verified":       False,
        "is_mock":           False,
        "success":           False,
        "error":             message,
    }


def _build_result(username: str, u: Dict, fetch_note: str) -> Dict:
    """
    Normalise raw Instagram user data into MAYAJAL's response shape.
    Handles nested (edge_followed_by.count) and flat (follower_count) layouts.
    """
    followers = (
        u.get("follower_count")
        or (u.get("edge_followed_by") or {}).get("count")
    )
    following = (
        u.get("following_count")
        or (u.get("edge_follow") or {}).get("count")
    )
    posts = (
        u.get("media_count")
        or u.get("posts_count")
        or u.get("post_count")
        or (u.get("edge_owner_to_timeline_media") or {}).get("count")
    )
    raw_pic = (
        u.get("profile_pic_url_hd")
        or (u.get("hd_profile_pic_url_info") or {}).get("url")
        or u.get("profile_pic_url")
    )
    proxied = _proxy_image(raw_pic) if raw_pic else None

    return {
        "username":          u.get("username", username),
        "display_name":      u.get("full_name") or u.get("fullName") or username,
        "bio":               u.get("biography") or u.get("bio") or "",
        "profile_url":       f"https://www.instagram.com/{u.get('username', username)}/",
        "follower_count":    followers,
        "following_count":   following,
        "post_count":        posts,
        "account_age_days":  None,          # Instagram does not expose creation date
        "profile_image_url": proxied or raw_pic,
        "is_private":        bool(u.get("is_private", False)),
        "is_verified":       bool(u.get("is_verified", False)),
        "is_mock":           False,
        "success":           True,
        "fetch_note":        fetch_note,
    }


# ── Provider 1: instagrapi (PRIMARY — private mobile API) ─────────────────────
#
# instagrapi uses Instagram's private mobile API (same endpoints as the iOS/Android
# app). Unlike the web API, these are NOT blocked by server/Docker IPs.
#
# Authentication hierarchy (first that works wins):
#   A. Load saved session from /app/ig_session.json  (persists across restarts)
#   B. Login via INSTAGRAM_SESSION_ID env var        (browser cookie, no rate limit)
#   C. Fresh login via INSTAGRAM_USERNAME / PASSWORD (may rate-limit from server IPs)
#
# Session file is at /app/ig_session.json which maps to ./backend/ig_session.json
# on the host via Docker volume mount — so it survives container rebuilds.

_ig_client = None
_ig_client_lock = threading.Lock()
_SESSION_FILE = "/app/ig_session.json"


def _get_ig_client():
    """Return a cached, logged-in instagrapi Client, or None if no credentials."""
    global _ig_client

    if _ig_client is not None:
        return _ig_client

    ig_user     = os.getenv("INSTAGRAM_USERNAME",   "").strip()
    ig_pass     = os.getenv("INSTAGRAM_PASSWORD",   "").strip()
    ig_sess_id  = os.getenv("INSTAGRAM_SESSION_ID", "").strip()

    if not (ig_user or ig_sess_id):
        return None

    with _ig_client_lock:
        if _ig_client is not None:
            return _ig_client

        from instagrapi import Client

        # ── A. Load saved session file ────────────────────────────────────────
        if os.path.exists(_SESSION_FILE):
            try:
                cl = Client()
                cl.delay_range = [1, 2]
                cl.load_settings(_SESSION_FILE)
                # Validate: session file sets user_id if the session is valid
                if cl.user_id:
                    print(f"[profile_fetch] instagrapi: loaded saved session (user_id={cl.user_id})")
                    _ig_client = cl
                    return _ig_client
                else:
                    print("[profile_fetch] instagrapi: saved session has no user_id, re-authenticating")
            except Exception as e:
                print(f"[profile_fetch] instagrapi: could not load saved session ({e})")

        # ── B. Login by session ID (browser cookie — no rate-limit risk) ──────
        if ig_sess_id:
            try:
                cl = Client()
                cl.delay_range = [1, 2]
                cl.login_by_sessionid(ig_sess_id)
                cl.dump_settings(_SESSION_FILE)
                print(f"[profile_fetch] instagrapi: authenticated via INSTAGRAM_SESSION_ID")
                _ig_client = cl
                return _ig_client
            except Exception as e:
                print(f"[profile_fetch] instagrapi: session-ID auth failed: {e}")

        # ── C. Fresh username/password login ──────────────────────────────────
        if ig_user and ig_pass:
            try:
                cl = Client()
                cl.delay_range = [1, 2]
                cl.login(ig_user, ig_pass)
                cl.dump_settings(_SESSION_FILE)
                print(f"[profile_fetch] instagrapi: logged in as @{ig_user}, session saved")
                _ig_client = cl
                return _ig_client
            except Exception as e:
                print(f"[profile_fetch] instagrapi login failed: {e}")
                _ig_client = None

    return _ig_client


def _instagrapi_worker(username: str, holder: list) -> None:
    """Runs in daemon thread. Stores result dict or sentinel in holder[0]."""
    global _ig_client
    try:
        cl = _get_ig_client()
        if cl is None:
            return

        user = cl.user_info_by_username(username)
        if user is None:
            return

        holder[0] = {
            "username":        user.username,
            "full_name":       user.full_name or user.username,
            "biography":       user.biography or "",
            "follower_count":  user.follower_count,
            "following_count": user.following_count,
            "media_count":     user.media_count,
            "profile_pic_url": str(user.profile_pic_url) if user.profile_pic_url else None,
            "is_private":      user.is_private,
            "is_verified":     user.is_verified,
        }

    except Exception as exc:
        err = str(exc).lower()
        print(f"[profile_fetch] instagrapi error: {exc}")
        if "not found" in err or "user not found" in err:
            holder[0] = {"__not_found": True}
        elif "login_required" in err or "challenge" in err or "bad_password" in err:
            with _ig_client_lock:
                _ig_client = None


def _try_instagrapi(username: str) -> Optional[Dict]:
    holder: list = [None]
    t = threading.Thread(
        target=_instagrapi_worker,
        args=(username, holder),
        daemon=True,
        name=f"instagrapi-{username}",
    )
    t.start()
    t.join(timeout=20)

    if t.is_alive():
        print(f"[profile_fetch] instagrapi: timed out after 20 s for @{username}")
        return None

    data = holder[0]
    if data is None:
        return None
    if data.get("__not_found"):
        return {"__not_found": True}

    return _build_result(username, data, "Live data via Instagram mobile API")


# ── Provider 2: Direct Instagram web API (httpx) ─────────────────────────────
# Fast (< 1 s failure on 429 from server IPs).

def _try_direct_api(username: str) -> Optional[Dict]:
    try:
        r = httpx.get(
            f"https://www.instagram.com/api/v1/users/web_profile_info/?username={username}",
            headers=_IG_HEADERS,
            timeout=8.0,
            follow_redirects=True,
        )
        if r.status_code == 429:
            print("[profile_fetch] direct API: 429 — server IP rate-limited")
            return None
        if r.status_code == 404:
            return {"__not_found": True}
        if r.status_code != 200:
            print(f"[profile_fetch] direct API: HTTP {r.status_code}")
            return None

        user = (r.json().get("data") or {}).get("user")
        if not user:
            return None

        return _build_result(username, user, "Live data via Instagram direct API")

    except Exception as exc:
        print(f"[profile_fetch] direct API error: {exc}")
        return None


# ── Provider 3: RapidAPI (optional fallback) ──────────────────────────────────
# Tried only when RAPIDAPI_KEY is set.

_RAPIDAPI_ENDPOINTS = [
    # instagram-scraper-api2 — best free tier (100 req/month); subscribe at rapidapi.com
    (
        "instagram-scraper-api2.p.rapidapi.com",
        "https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url={username}",
        "flat_data",
    ),
    # instagram-profile — subscribed; provider backend is currently returning 500
    (
        "instagram-profile.p.rapidapi.com",
        "https://instagram-profile.p.rapidapi.com/getprofile?username={username}",
        "nested",
    ),
]


def _parse_rapidapi_response(body: dict, parser: str, username: str) -> Optional[Dict]:
    if parser == "nested":
        user = (body.get("data") or {}).get("user") or body.get("user") or body
        if not user.get("username"):
            return None
        return user
    if parser == "flat_data":
        user = body.get("data") or {}
        if not user.get("username"):
            return None
        return user
    return None


def _try_rapidapi(username: str, api_key: str) -> Optional[Dict]:
    for host, url_tpl, parser in _RAPIDAPI_ENDPOINTS:
        url = url_tpl.format(username=username)
        try:
            r = httpx.get(
                url,
                headers={"x-rapidapi-host": host, "x-rapidapi-key": api_key},
                timeout=15.0,
            )
            if r.status_code == 403:
                print(f"[profile_fetch] RapidAPI {host}: not subscribed — skipping")
                continue
            if r.status_code == 429:
                print(f"[profile_fetch] RapidAPI {host}: plan rate limit")
                continue
            if r.status_code in (500, 502, 503, 504):
                print(f"[profile_fetch] RapidAPI {host}: provider error {r.status_code}")
                continue
            if r.status_code != 200:
                print(f"[profile_fetch] RapidAPI {host}: HTTP {r.status_code}")
                continue

            raw = _parse_rapidapi_response(r.json(), parser, username)
            if not raw:
                continue

            result = _build_result(username, raw, f"Live data via RapidAPI ({host})")
            if result.get("success"):
                print(f"[profile_fetch] RapidAPI SUCCESS via {host}")
                return result

        except Exception as exc:
            print(f"[profile_fetch] RapidAPI {host} error: {exc}")
            continue

    return None


# ── Provider 0: Host-side proxy (residential IP) ─────────────────────────────
# When INSTAGRAM_PROXY_URL is set (e.g. http://host.docker.internal:9090), the
# backend calls the proxy which runs on the host machine with a residential IP.
# Start the proxy with: python backend/ig_proxy.py

def _try_host_proxy(username: str, proxy_url: str) -> Optional[Dict]:
    try:
        r = httpx.get(
            f"{proxy_url}/fetch",
            params={"username": username},
            timeout=15.0,
        )
        if r.status_code == 404:
            return {"__not_found": True}
        if r.status_code != 200:
            print(f"[profile_fetch] host proxy: HTTP {r.status_code} — {r.text[:80]}")
            return None
        data = r.json()
        if data.get("error"):
            err = data["error"].lower()
            if "not found" in err:
                return {"__not_found": True}
            print(f"[profile_fetch] host proxy error: {data['error']}")
            return None
        return _build_result(username, data, "Live data via host proxy")
    except Exception as exc:
        print(f"[profile_fetch] host proxy connection error: {exc}")
        return None


# ── Public entry point ────────────────────────────────────────────────────────

def fetch_profile(platform: str, username: str) -> Dict:
    """
    Fetch real Instagram profile data.
    Provider order: instagrapi (mobile API) → direct web API → RapidAPI.
    Never generates mock, random, or estimated values.
    Account age is always None — Instagram does not expose account creation date.
    """
    username = username.lstrip("@").strip()

    if platform != "instagram":
        return _error(
            username, platform,
            f"Auto-fetch is not yet available for {platform.title()}. "
            "Please fill in the profile details manually.",
        )

    api_key      = os.getenv("RAPIDAPI_KEY", "")
    proxy_url    = os.getenv("INSTAGRAM_PROXY_URL", "").rstrip("/")

    # ── 0. Host proxy (residential IP — bypasses Docker IP block) ─────────────
    if proxy_url:
        result = _try_host_proxy(username, proxy_url)
        if result:
            if result.get("__not_found"):
                return _error(username, "instagram",
                              f"@{username} was not found on Instagram. "
                              "Please verify the username.")
            if result.get("success"):
                print(f"[profile_fetch] SUCCESS via host proxy for @{username}")
                return result

    # ── 1. instagrapi via private mobile API (primary) ────────────────────────
    result = _try_instagrapi(username)
    if result:
        if result.get("__not_found"):
            return _error(username, "instagram",
                          f"@{username} was not found on Instagram. "
                          "Please verify the username.")
        if result.get("success"):
            print(f"[profile_fetch] SUCCESS via instagrapi for @{username}")
            return result

    # ── 2. Direct Instagram web API (fast fallback) ───────────────────────────
    result = _try_direct_api(username)
    if result:
        if result.get("__not_found"):
            return _error(username, "instagram",
                          f"@{username} was not found on Instagram. "
                          "Please verify the username.")
        if result.get("success"):
            print(f"[profile_fetch] SUCCESS via direct API for @{username}")
            return result

    # ── 3. RapidAPI (optional fallback) ──────────────────────────────────────
    if api_key:
        result = _try_rapidapi(username, api_key)
        if result and result.get("success"):
            return result

    # ── All providers exhausted ───────────────────────────────────────────────
    hint = (
        "Instagram blocks all API requests from cloud/Docker IPs. "
        "To enable automatic profile fetching, subscribe to the free plan of "
        "'instagram-scraper-api2' on RapidAPI.com — your existing RAPIDAPI_KEY "
        "will work once subscribed."
    )

    return _error(
        username, "instagram",
        "Could not retrieve profile data automatically. "
        + hint
        + " Or click 'Open on Instagram ↗' below and fill in details manually.",
    )
