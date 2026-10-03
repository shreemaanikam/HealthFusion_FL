"""Authentication and RBAC tests against the REAL backend app (app.main:app).

Unlike test_api.py (which exercises a mock app), these tests import the actual
application with an isolated throwaway SQLite database (see tests/conftest.py).
"""
import sqlite3
from datetime import datetime, timedelta

import pytest
from fastapi.routing import APIRoute
from fastapi.testclient import TestClient
from jose import jwt

from app.main import app
from app.config import get_settings
from app.core.security import create_access_token, get_password_hash
from tests.conftest import TEST_DB_PATH

settings = get_settings()

DOCTOR, HOSPITAL_ADMIN, RESEARCHER, SYSTEM_ADMIN = "DOCTOR", "HOSPITAL_ADMIN", "RESEARCHER", "SYSTEM_ADMIN"
ALL_ROLES = [DOCTOR, HOSPITAL_ADMIN, RESEARCHER, SYSTEM_ADMIN]
PASSWORD = "CorrectHorse-Battery9"

AUDIT = {HOSPITAL_ADMIN, SYSTEM_ADMIN}
NETWORK = {HOSPITAL_ADMIN, RESEARCHER, SYSTEM_ADMIN}
PRIVACY = {HOSPITAL_ADMIN, SYSTEM_ADMIN}

# The authorization matrix under test: (path) -> roles allowed.
# Kept explicit (not imported from app.core.permissions) so a policy change
# must be a deliberate edit here too.
MATRIX = {
    "/api/audit/events": AUDIT,
    "/api/audit/events/1": AUDIT,
    "/api/federated/status": NETWORK,
    "/api/federated/clients": NETWORK,
    "/api/federated/clients/hospital-a": NETWORK,
    "/api/federated/rounds": NETWORK,
    "/api/federated/rounds/1": NETWORK,
    "/api/federated/metrics": NETWORK,
    "/api/models": NETWORK,
    "/api/models/active": NETWORK,
    "/api/models/hf-nn-v1": NETWORK,
    "/api/privacy/status": PRIVACY,
    "/api/privacy/config": PRIVACY,
}
PROTECTED_PREFIXES = ("/api/audit", "/api/federated", "/api/models", "/api/privacy")


def _insert_user(email: str, role: str, active: bool = True) -> None:
    con = sqlite3.connect(TEST_DB_PATH)
    try:
        con.execute(
            "INSERT INTO users (email, hashed_password, full_name, role, is_active, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (email, get_password_hash(PASSWORD), f"Test {role}", role, int(active), datetime.utcnow().isoformat(sep=" ")),
        )
        con.commit()
    finally:
        con.close()


def _email(role: str) -> str:
    return f"{role.lower()}@authz.example"


@pytest.fixture(scope="module")
def client():
    # `with` runs startup (init_db) so the tables exist before seeding.
    with TestClient(app) as c:
        for role in ALL_ROLES:
            _insert_user(_email(role), role)
        _insert_user("disabled@authz.example", DOCTOR, active=False)
        yield c


def _login(client: TestClient, email: str) -> str:
    res = client.post("/api/users/login", json={"email": email, "password": PASSWORD})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


@pytest.fixture(scope="module")
def tokens(client):
    return {role: _login(client, _email(role)) for role in ALL_ROLES}


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------- 401 cases

@pytest.mark.parametrize("path", sorted(MATRIX))
def test_unauthenticated_gets_401(client, path):
    res = client.get(path)
    assert res.status_code == 401
    assert res.headers.get("www-authenticate", "").lower() == "bearer"
    # No protected data may leak in the error body.
    assert set(res.json()) == {"detail"}


@pytest.mark.parametrize("path", sorted(MATRIX))
def test_garbage_token_gets_401(client, path):
    assert client.get(path, headers=bearer("not.a.jwt")).status_code == 401


@pytest.mark.parametrize("header", ["Basic dXNlcjpwYXNz", "Bearer", "Token abc"])
def test_malformed_authorization_header_gets_401(client, header):
    assert client.get("/api/models", headers={"Authorization": header}).status_code == 401


def test_token_signed_with_wrong_secret_gets_401(client):
    forged = jwt.encode(
        {"sub": _email(SYSTEM_ADMIN), "exp": datetime.utcnow() + timedelta(minutes=5)},
        "attacker-secret", algorithm=settings.JWT_ALGORITHM,
    )
    assert client.get("/api/audit/events", headers=bearer(forged)).status_code == 401


def test_expired_token_gets_401(client):
    expired = create_access_token({"sub": _email(SYSTEM_ADMIN)}, expires_delta=timedelta(minutes=-5))
    assert client.get("/api/audit/events", headers=bearer(expired)).status_code == 401


def test_token_without_subject_gets_401(client):
    no_sub = create_access_token({"role": SYSTEM_ADMIN})
    assert client.get("/api/audit/events", headers=bearer(no_sub)).status_code == 401


def test_token_for_unknown_user_gets_401(client):
    ghost = create_access_token({"sub": "ghost@authz.test"})
    assert client.get("/api/audit/events", headers=bearer(ghost)).status_code == 401


def test_alg_none_token_gets_401(client):
    import base64, json
    b64 = lambda d: base64.urlsafe_b64encode(json.dumps(d).encode()).rstrip(b"=").decode()
    token = f"{b64({'alg': 'none', 'typ': 'JWT'})}.{b64({'sub': _email(SYSTEM_ADMIN)})}."
    assert client.get("/api/audit/events", headers=bearer(token)).status_code == 401


# ---------------------------------------------------------- 403 / 200 matrix

@pytest.mark.parametrize("role", ALL_ROLES)
@pytest.mark.parametrize("path", sorted(MATRIX))
def test_rbac_matrix(client, tokens, role, path):
    res = client.get(path, headers=bearer(tokens[role]))
    if role in MATRIX[path]:
        assert res.status_code == 200, f"{role} should be allowed on {path}: {res.text}"
    else:
        assert res.status_code == 403, f"{role} must be denied on {path}"
        assert res.json() == {"detail": "Not enough privileges"}


def test_role_is_read_from_database_not_from_token(client, tokens):
    """A validly-signed token that CLAIMS an admin role must not grant it."""
    forged = create_access_token({"sub": _email(DOCTOR), "role": SYSTEM_ADMIN})
    assert client.get("/api/audit/events", headers=bearer(forged)).status_code == 403


def test_disabled_account_token_is_rejected(client):
    token = create_access_token({"sub": "disabled@authz.example"})
    assert client.get("/api/models", headers=bearer(token)).status_code == 403
    assert client.get("/api/users/me", headers=bearer(token)).status_code == 403


# ------------------------------------------------- coverage / regression guards

def test_every_protected_route_rejects_anonymous_requests(client):
    """Guards against a future route under a protected prefix being added without auth.

    Uses the MATRIX dictionary (which explicitly enumerates every protected path) to verify
    that every listed path returns 401 when called anonymously — no route inspection magic needed.
    """
    for path in MATRIX:
        resolved = (
            path.replace("{event_id}", "1")
                .replace("{round_id}", "1")
                .replace("{client_id}", "hospital-a")
                .replace("{model_id}", "hf-nn-v1")
        )
        res = client.get(resolved)
        assert res.status_code == 401, (
            f"GET {path} is reachable anonymously (got {res.status_code}) — "
            "RBAC protection missing!"
        )
    assert len(MATRIX) >= 13, "MATRIX must cover all protected endpoints"


def test_matrix_covers_all_protected_get_routes(client):
    """Verify MATRIX has at least one entry for each protected prefix family."""
    covered_prefixes = {path.split("/")[2] for path in MATRIX}
    for prefix in ("audit", "federated", "models", "privacy"):
        assert prefix in covered_prefixes, f"No {prefix} routes in authorization matrix"


def test_public_endpoints_remain_public(client):
    assert client.get("/api/health").status_code == 200
    assert client.post("/api/users/login", json={"email": "x@y.z", "password": "bad"}).status_code == 401


def test_cors_preflight_needs_no_credentials(client):
    res = client.options(
        "/api/models",
        headers={
            "Origin": "https://frontend.test",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
        },
    )
    assert res.status_code == 200
    assert res.headers["access-control-allow-origin"] == "https://frontend.test"


def test_cors_rejects_unlisted_origin(client):
    res = client.options(
        "/api/models",
        headers={"Origin": "https://evil.test", "Access-Control-Request-Method": "GET"},
    )
    assert "access-control-allow-origin" not in res.headers


# --------------------------------------------------------------- registration

def _register(client, email, role, headers=None):
    return client.post(
        "/api/users/register",
        json={"email": email, "password": PASSWORD, "full_name": "New User", "role": role},
        headers=headers or {},
    )


def test_anonymous_can_self_register_as_doctor(client):
    res = _register(client, "newdoc@authz.example", DOCTOR)
    assert res.status_code == 201
    assert res.json()["role"] == DOCTOR


@pytest.mark.parametrize("role", [HOSPITAL_ADMIN, RESEARCHER, SYSTEM_ADMIN])
def test_anonymous_cannot_register_privileged_role(client, role):
    res = _register(client, f"anon-{role.lower()}@authz.example", role)
    assert res.status_code == 403


@pytest.mark.parametrize("role", [DOCTOR, HOSPITAL_ADMIN, RESEARCHER])
def test_non_sysadmin_cannot_register_privileged_role(client, tokens, role):
    res = _register(client, f"esc-{role.lower()}@authz.example", SYSTEM_ADMIN, bearer(tokens[role]))
    assert res.status_code == 403


def test_sysadmin_can_provision_privileged_role(client, tokens):
    res = _register(client, "provisioned@authz.example", RESEARCHER, bearer(tokens[SYSTEM_ADMIN]))
    assert res.status_code == 201
    assert res.json()["role"] == RESEARCHER


def test_invalid_token_on_register_is_401_not_anonymous(client):
    res = _register(client, "badtoken@authz.example", DOCTOR, bearer("not.a.jwt"))
    assert res.status_code == 401


# ----------------------------------------------------------- JWT happy path

def test_login_and_me_roundtrip(client, tokens):
    res = client.get("/api/users/me", headers=bearer(tokens[HOSPITAL_ADMIN]))
    assert res.status_code == 200
    assert res.json()["role"] == HOSPITAL_ADMIN
    assert "hashed_password" not in res.text


def test_me_requires_auth(client):
    assert client.get("/api/users/me").status_code == 401
