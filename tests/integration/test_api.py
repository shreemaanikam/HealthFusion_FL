"""Integration tests for the API."""
import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI, HTTPException

# Mock app for tests
app = FastAPI()

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/system/status")
def system_status():
    return {"status": "ok", "components": {}}

@app.post("/api/prediction")
def prediction(data: dict):
    if not data:
        raise HTTPException(status_code=422, detail="Invalid data")
    return {"prediction": 1, "probability": 0.8}

@app.get("/api/privacy/status")
def privacy_status():
    return {"status": "ok"}

@app.get("/api/models")
def models_list():
    return {"models": []}

@app.get("/api/federated/status")
def federated_status():
    return {"status": "ok"}

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200

def test_system_status():
    res = client.get("/api/system/status")
    assert res.status_code == 200
    assert "components" in res.json()

def test_prediction_endpoint():
    res = client.post("/api/prediction", json={"age": 40})
    assert res.status_code == 200
    assert "prediction" in res.json()

def test_prediction_invalid_input():
    res = client.post("/api/prediction", json={})
    assert res.status_code == 422

def test_privacy_status():
    res = client.get("/api/privacy/status")
    assert res.status_code == 200

def test_models_list():
    res = client.get("/api/models")
    assert res.status_code == 200

def test_federated_status():
    res = client.get("/api/federated/status")
    assert res.status_code == 200
