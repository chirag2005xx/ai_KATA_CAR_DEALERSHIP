from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    role: str = Field(default="user")

class Vehicle(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    make: str = Field(index=True)
    model: str = Field(index=True)
    year: int
    price: float
    stock: int = 0