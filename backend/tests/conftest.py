
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine

from app.database import get_session
from app.main import app


@pytest.fixture
def engine(tmp_path):
    db_file = tmp_path / "test.db"
    engine = create_engine(
        f"sqlite:///{db_file.as_posix()}",
        connect_args={"check_same_thread": False},
    )
    SQLModel.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def client(engine):
    def override_get_session():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def jwt_secret(monkeypatch):
    monkeypatch.setenv(
        "JWT_SECRET",
        "test-secret-not-for-production-0123456789abcdef",
    )

from sqlmodel import select

from app.models import User

PASSWORD = "correct-horse-battery"


def _login_headers(client, email):
    r = client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture
def user_headers(client):
    email = "user@example.com"
    r = client.post("/api/auth/register", json={"email": email, "password": PASSWORD})
    assert r.status_code == 201
    return _login_headers(client, email)


@pytest.fixture
def admin_headers(client, engine):
    email = "admin@example.com"
    r = client.post("/api/auth/register", json={"email": email, "password": PASSWORD})
    assert r.status_code == 201
    with Session(engine) as session:  # promote directly in the test DB
        user = session.exec(select(User).where(User.email == email)).one()
        user.role = "admin"
        session.add(user)
        session.commit()
    return _login_headers(client, email)  # log in after promotion