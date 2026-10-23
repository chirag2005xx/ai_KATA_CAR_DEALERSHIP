
from sqlmodel import Field, SQLModel


class UserCreate(SQLModel):
    email: str
    password: str


class UserPublic(SQLModel):
    id: int
    email: str
    role: str

class LoginRequest(SQLModel):
    email: str
    password: str


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"

class VehicleCreate(SQLModel):
    make: str
    model: str
    category: str
    year: int
    price: float = Field(ge=0)
    stock: int = Field(default=0, ge=0)


class VehicleReplace(SQLModel):  # PUT: full replacement, no stock
    make: str
    model: str
    category: str
    year: int
    price: float = Field(ge=0)


class VehicleUpdate(SQLModel):  # PATCH: partial, no stock
    make: str | None = None
    model: str | None = None
    category: str | None = None
    year: int | None = None
    price: float | None = Field(default=None, ge=0)


class VehiclePublic(VehicleCreate):
    id: int
class QuantityRequest(SQLModel):
    quantity: int = Field(gt=0)