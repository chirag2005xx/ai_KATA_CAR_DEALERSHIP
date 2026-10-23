import os

from sqlmodel import Session, create_engine

database_url = os.getenv("DATABASE_URL", "sqlite:///./app.db")
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(
    database_url,
    connect_args={"check_same_thread": False} if database_url.startswith("sqlite:") else {},
)


def get_session():
    with Session(engine) as session:
        yield session