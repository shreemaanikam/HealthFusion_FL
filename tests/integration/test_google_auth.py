import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
import sqlite3

from app.main import app
from app.config import get_settings
from app.core.security import RoleEnum, get_password_hash
from tests.conftest import TEST_DB_PATH

settings = get_settings()

@pytest.fixture
def client():
    # FastAPI's TestClient runs lifespan events to init the DB
    with TestClient(app) as c:
        yield c

@pytest.fixture
def mock_google_verify():
    with patch("app.services.google_auth_service.id_token.verify_oauth2_token") as mock:
        yield mock

@pytest.fixture
def mock_settings():
    settings.GOOGLE_CLIENT_ID = "test-client-id"
    yield settings

def test_google_login_new_user(client: TestClient, mock_google_verify, mock_settings):
    mock_google_verify.return_value = {
        "iss": "accounts.google.com",
        "email_verified": True,
        "email": "new.google@example.com",
        "sub": "google123456",
        "name": "Google User"
    }
    
    response = client.post("/api/users/google", json={"credential": "mock_token"})
    assert response.status_code == 200
    assert "access_token" in response.json()
    
    with sqlite3.connect(TEST_DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT google_sub, role, full_name FROM users WHERE email='new.google@example.com'")
        user = cursor.fetchone()
        
    assert user is not None
    assert user[0] == "google123456"
    assert user[1] == "DOCTOR"
    assert user[2] == "Google User"

def test_google_login_existing_email_links_account(client: TestClient, mock_google_verify, mock_settings):
    with sqlite3.connect(TEST_DB_PATH) as conn:
        cursor = conn.cursor()
        pwd = get_password_hash("test")
        cursor.execute(
            "INSERT INTO users (email, hashed_password, role, is_active) VALUES (?, ?, ?, ?)",
            ("existing@example.com", pwd, "HOSPITAL_ADMIN", 1)
        )
        conn.commit()
    
    mock_google_verify.return_value = {
        "iss": "accounts.google.com",
        "email_verified": True,
        "email": "existing@example.com",
        "sub": "google789",
    }
    
    response = client.post("/api/users/google", json={"credential": "mock_token"})
    assert response.status_code == 200
    
    with sqlite3.connect(TEST_DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT google_sub, role FROM users WHERE email='existing@example.com'")
        user = cursor.fetchone()
        
    assert user[0] == "google789"
    assert user[1] == "HOSPITAL_ADMIN"

def test_google_login_invalid_issuer(client: TestClient, mock_google_verify, mock_settings):
    mock_google_verify.return_value = {
        "iss": "invalid.issuer.com",
        "email_verified": True,
        "email": "bad@example.com",
        "sub": "123",
    }
    response = client.post("/api/users/google", json={"credential": "mock_token"})
    assert response.status_code == 401
    assert "Wrong issuer" in response.json()["detail"]

def test_google_login_unverified_email(client: TestClient, mock_google_verify, mock_settings):
    mock_google_verify.return_value = {
        "iss": "accounts.google.com",
        "email_verified": False,
        "email": "unverified@example.com",
        "sub": "123",
    }
    response = client.post("/api/users/google", json={"credential": "mock_token"})
    assert response.status_code == 401
    assert "Email not verified" in response.json()["detail"]
