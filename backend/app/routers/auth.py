from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session

from app.database import get_session
from app.models import User
from app.schemas import UserCreate, UserPublic
from app.security import hash_password


router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
)
def register(data: UserCreate, session: Session = Depends(get_session)):
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
    )
    session.add(user)

    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        ) from exc

    session.refresh(user)
    return user

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session, select

from app.models import User
from app.schemas import LoginRequest, Token, UserPublic
from app.security import create_access_token, decode_access_token, verify_password

bearer = HTTPBearer(auto_error=False)


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(status_code=401, detail=detail, headers={"WWW-Authenticate": "Bearer"})


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    session: Session = Depends(get_session),
) -> User:
    if creds is None:
        raise _unauthorized("Not authenticated")
    sub = decode_access_token(creds.credentials)
    if sub is None or not sub.isdigit():
        raise _unauthorized("Invalid token")
    user = session.get(User, int(sub))
    if user is None:
        raise _unauthorized("Invalid token")
    return user


@router.post("/login", response_model=Token)
def login(data: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == data.email)).first()
    if user is None or not verify_password(data.password, user.hashed_password):
        raise _unauthorized("Incorrect email or password")
    return Token(access_token=create_access_token(str(user.id)))


@router.get("/me", response_model=UserPublic)
def me(current_user: User = Depends(get_current_user)):
    return current_user