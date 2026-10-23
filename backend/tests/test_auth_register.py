
from sqlalchemy import text


def test_register_saves_user_and_hides_password(client, engine):
    payload = {"email": "chirag@example.com", "password": "correct-horse-battery"}

    response = client.post("/api/auth/register", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == payload["email"]
    assert "id" in body
    assert "password" not in body
    assert "hashed_password" not in body

    with engine.connect() as conn:
        emails = conn.execute(text('SELECT email FROM "user"')).scalars().all()
    assert emails == [payload["email"]]