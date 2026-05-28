"""Curl-style HTTP tests against the live preview URL for /api/auth/apple.

These verify error paths via the public ingress (no Apple JWKS mock here -
malformed/invalid tokens are expected to fail at the JWKS/decode step with 401).
Also performs regression checks on existing endpoints.
"""
import os
import requests
import pytest

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://peptide-research-9.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# --- /api/auth/apple negative paths ---
def test_apple_missing_token(s):
    r = s.post(f"{BASE_URL}/api/auth/apple", json={})
    assert r.status_code == 422, r.text


def test_apple_invalid_token(s):
    r = s.post(f"{BASE_URL}/api/auth/apple", json={"identity_token": "not.a.jwt"})
    assert r.status_code == 401, r.text
    assert "Apple" in r.json().get("detail", ""), r.text


def test_apple_empty_token_string(s):
    r = s.post(f"{BASE_URL}/api/auth/apple", json={"identity_token": ""})
    # empty string -> pydantic may accept but JWT decode fails -> 401
    assert r.status_code in (401, 422), r.text


def test_apple_garbage_jwt(s):
    # Looks like a JWT but signature is bogus -> Apple JWKS lookup fails -> 401
    bogus = "eyJhbGciOiJFUzI1NiIsImtpZCI6Im5vbmUifQ.eyJzdWIiOiJ4In0.sig"
    r = s.post(f"{BASE_URL}/api/auth/apple", json={"identity_token": bogus})
    assert r.status_code == 401, r.text


# --- regression: existing endpoints still work ---
def test_health_endpoint(s):
    # Try a few possible health URLs
    for path in ("/api/health", "/api/"):
        r = s.get(f"{BASE_URL}{path}")
        if r.status_code == 200:
            return
    pytest.fail("No healthy /api/health or /api/ endpoint reachable")


def test_auth_me_unauthenticated(s):
    r = s.get(f"{BASE_URL}/api/auth/me")
    assert r.status_code == 401, r.text


def test_auth_me_invalid_bearer(s):
    r = s.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": "Bearer not-a-real-session"})
    assert r.status_code == 401, r.text


def test_auth_logout_no_session(s):
    r = s.post(f"{BASE_URL}/api/auth/logout")
    assert r.status_code == 200, r.text


def test_auth_session_route_exists(s):
    # /auth/session is referenced in review request - confirm it exists (any status != 404 is fine)
    r = s.post(f"{BASE_URL}/api/auth/session", json={})
    assert r.status_code != 404, r.text


def test_recurring_items_list(s):
    # Should be reachable (likely 401 since unauth, but route exists)
    r = s.get(f"{BASE_URL}/api/recurring-items")
    assert r.status_code != 404, r.text


def test_tracker_items_endpoint_exists(s):
    r = s.get(f"{BASE_URL}/api/tracker/items")
    assert r.status_code != 404, r.text


def test_journal_entries_endpoint_exists(s):
    r = s.get(f"{BASE_URL}/api/journal/entries")
    assert r.status_code != 404, r.text


def test_calculator_presets_endpoint_exists(s):
    r = s.get(f"{BASE_URL}/api/calculator/presets")
    assert r.status_code != 404, r.text


def test_ai_ask_endpoint_exists(s):
    # POST with no body -> should be 422 (route exists)
    r = s.post(f"{BASE_URL}/api/ai/ask", json={})
    assert r.status_code in (200, 400, 401, 422, 500), r.text
    assert r.status_code != 404, r.text
