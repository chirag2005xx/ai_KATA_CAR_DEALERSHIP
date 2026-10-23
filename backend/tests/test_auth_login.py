# backend/tests/test_auth_login.py
EMAIL = "chirag@example.com"
PASSWORD = "correct-horse-battery"


def register(client):
    r = client.post("/api/auth/register", json={"email": EMAIL, "password": PASSWORD})
    assert r.status_code == 201


def test_login_correct_password_returns_jwt(client):
    register(client)

    response = client.post("/api/auth/login", json={"email": EMAIL, "password": PASSWORD})

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert len(body["access_token"].split(".")) == 3  # header.payload.signature


def test_login_wrong_password_returns_401(client):
    register(client)

    response = client.post("/api/auth/login", json={"email": EMAIL, "password": "wrong-password"})

    assert response.status_code == 401
    assert "access_token" not in response.json()


def test_protected_endpoint_rejects_missing_token(client):
    response = client.get("/api/auth/me")

    assert response.status_code == 401


def test_protected_endpoint_rejects_invalid_token(client):
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer not.a.real-token"})

    assert response.status_code == 401


def test_protected_endpoint_accepts_valid_token(client):
    register(client)
    token = client.post("/api/auth/login", json={"email": EMAIL, "password": PASSWORD}).json()["access_token"]

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["email"] == EMAIL
    assert "hashed_password" not in response.json()