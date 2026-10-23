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