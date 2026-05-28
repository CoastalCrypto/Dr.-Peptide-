"""Integration tests for the /api/auth/apple endpoint.

These tests mock Apple's JWKS so we can produce a "valid" identity token signed
with our own ES256 key and verify the endpoint creates/looks up users and
returns a session token correctly.
"""
import os
import time
import uuid
import pytest
from unittest.mock import patch, MagicMock

import jwt
from cryptography.hazmat.primitives.asymmetric.ec import generate_private_key, SECP256R1
from cryptography.hazmat.primitives.serialization import (
    Encoding, PrivateFormat, PublicFormat, NoEncryption,
)
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport

# Ensure expected APPLE_BUNDLE_ID is set before importing server.
os.environ["APPLE_BUNDLE_ID"] = "com.peptrackpro.app"

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from server import app, db  # noqa: E402


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


@pytest.fixture(scope="module")
def es256_keypair():
    """Generate an ES256 keypair for signing test Apple tokens."""
    priv = generate_private_key(SECP256R1())
    pub = priv.public_key()
    priv_pem = priv.private_bytes(Encoding.PEM, PrivateFormat.PKCS8, NoEncryption())
    pub_pem = pub.public_bytes(Encoding.PEM, PublicFormat.SubjectPublicKeyInfo)
    return priv, pub, priv_pem, pub_pem


def make_apple_token(priv_key, *, sub="001.testuser", email="test@privaterelay.appleid.com",
                     aud="com.peptrackpro.app", exp_offset=3600, kid="test-key-id"):
    payload = {
        "iss": "https://appleid.apple.com",
        "sub": sub,
        "aud": aud,
        "iat": int(time.time()),
        "exp": int(time.time()) + exp_offset,
        "email": email,
    }
    return jwt.encode(payload, priv_key, algorithm="ES256", headers={"kid": kid})


@pytest.fixture
def patched_jwk_client(es256_keypair):
    """Patch the Apple JWKS client to return our test public key."""
    priv, pub, _, _ = es256_keypair

    fake_key = MagicMock()
    fake_key.key = pub  # PyJWT can use a cryptography public key object directly

    fake_client = MagicMock()
    fake_client.get_signing_key_from_jwt.return_value = fake_key

    with patch("server._get_apple_jwk_client", return_value=fake_client):
        yield fake_client


def test_apple_auth_missing_token(client):
    resp = client.post("/api/auth/apple", json={})
    assert resp.status_code == 422


def test_apple_auth_invalid_token(client):
    resp = client.post("/api/auth/apple", json={"identity_token": "not.a.jwt"})
    assert resp.status_code == 401
    assert "Apple" in resp.json()["detail"]


def test_apple_auth_wrong_audience(client, patched_jwk_client, es256_keypair):
    """Reject tokens whose aud does not match our configured bundle id."""
    priv, _, _, _ = es256_keypair
    sub = f"001.test.aud.{uuid.uuid4().hex[:8]}"
    token = make_apple_token(priv, sub=sub, aud="com.malicious.app")

    resp = client.post("/api/auth/apple", json={"identity_token": token})
    assert resp.status_code == 401
    assert "audience" in resp.json()["detail"].lower() or "invalid" in resp.json()["detail"].lower()


def test_apple_auth_expired_token(client, patched_jwk_client, es256_keypair):
    priv, _, _, _ = es256_keypair
    sub = f"001.test.exp.{uuid.uuid4().hex[:8]}"
    token = make_apple_token(priv, sub=sub, exp_offset=-100)

    resp = client.post("/api/auth/apple", json={"identity_token": token})
    assert resp.status_code == 401
    assert "expired" in resp.json()["detail"].lower()


# --- DB-touching tests use AsyncClient to avoid motor+TestClient event-loop issues ---
# These two scenarios are combined into a single test function so they share
# one event loop (motor's client is bound to a single loop at import time).

@pytest.mark.asyncio
async def test_apple_auth_create_then_relogin(patched_jwk_client, es256_keypair):
    """Full flow: first sign-in creates user, second sign-in (Apple omits email) reuses it."""
    priv, _, _, _ = es256_keypair
    sub = f"001.test.flow.{uuid.uuid4().hex[:8]}"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # First sign-in: Apple sends fullName + email (first-time only behavior)
        token1 = make_apple_token(priv, sub=sub, email="newuser@privaterelay.appleid.com")
        r1 = await ac.post(
            "/api/auth/apple",
            json={
                "identity_token": token1,
                "authorization_code": "auth-code-abc",
                "email": "newuser@privaterelay.appleid.com",
                "full_name": "Jane Doe",
            },
        )
        assert r1.status_code == 200, r1.text
        b1 = r1.json()
        assert b1["email"] == "newuser@privaterelay.appleid.com"
        assert b1["name"] == "Jane Doe"
        assert b1["user_id"].startswith("user_")
        assert b1["session_token"].startswith("session_")
        user_id_1 = b1["user_id"]

        # Second sign-in: Apple omits email/name; backend resolves by Apple sub.
        token2 = jwt.encode(
            {
                "iss": "https://appleid.apple.com",
                "sub": sub,
                "aud": "com.peptrackpro.app",
                "iat": int(time.time()),
                "exp": int(time.time()) + 3600,
            },
            priv,
            algorithm="ES256",
            headers={"kid": "test-key-id"},
        )
        r2 = await ac.post("/api/auth/apple", json={"identity_token": token2})
        assert r2.status_code == 200, r2.text
        b2 = r2.json()
        assert b2["user_id"] == user_id_1, "Same Apple sub must map to same user"
        assert b2["email"] == "newuser@privaterelay.appleid.com"
        assert b2["name"] == "Jane Doe"

    # Cleanup
    await db.users.delete_one({"apple_sub": sub})

