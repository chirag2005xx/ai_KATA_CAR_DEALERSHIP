from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, update
from sqlmodel import Session, col, select

from app.database import get_session
from app.models import User, Vehicle
from app.routers.auth import get_current_user
from app.schemas import (
    QuantityRequest,
    VehicleCreate,
    VehiclePublic,
    VehicleReplace,
    VehicleUpdate,
)

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


def _get_or_404(session: Session, vehicle_id: int) -> Vehicle:
    vehicle = session.get(Vehicle, vehicle_id)
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@router.post("", response_model=VehiclePublic, status_code=201)
def create_vehicle(
    data: VehicleCreate,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    vehicle = Vehicle(**data.model_dump())
    session.add(vehicle)
    session.commit()
    session.refresh(vehicle)
    return vehicle


@router.get("", response_model=list[VehiclePublic])
def list_vehicles(
    q: str | None = None,  # extra: not part of the required API
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    stmt = select(Vehicle)
    if q:
        stmt = stmt.where(
            or_(
                col(Vehicle.make).icontains(q, autoescape=True),
                col(Vehicle.model).icontains(q, autoescape=True),
            )
        )
    return session.exec(stmt.order_by(Vehicle.id)).all()


# MUST be declared before any "/{vehicle_id}" route
@router.get("/search", response_model=list[VehiclePublic])
def search_vehicles(
    make: str | None = None,
    model: str | None = None,
    category: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    stmt = select(Vehicle)
    if make is not None:
        stmt = stmt.where(col(Vehicle.make).icontains(make, autoescape=True))
    if model is not None:
        stmt = stmt.where(col(Vehicle.model).icontains(model, autoescape=True))
    if category is not None:
        stmt = stmt.where(col(Vehicle.category).icontains(category, autoescape=True))
    if min_price is not None:
        stmt = stmt.where(col(Vehicle.price) >= min_price)
    if max_price is not None:
        stmt = stmt.where(col(Vehicle.price) <= max_price)
    return session.exec(stmt.order_by(Vehicle.id)).all()


@router.put("/{vehicle_id}", response_model=VehiclePublic)
def replace_vehicle(
    vehicle_id: int,
    data: VehicleReplace,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    vehicle = _get_or_404(session, vehicle_id)
    for key, value in data.model_dump().items():
        setattr(vehicle, key, value)
    session.add(vehicle)
    session.commit()
    session.refresh(vehicle)
    return vehicle


@router.patch("/{vehicle_id}", response_model=VehiclePublic)  # extra
def update_vehicle(
    vehicle_id: int,
    data: VehicleUpdate,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    vehicle = _get_or_404(session, vehicle_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(vehicle, key, value)
    session.add(vehicle)
    session.commit()
    session.refresh(vehicle)
    return vehicle


@router.delete("/{vehicle_id}", status_code=204)
def delete_vehicle(
    vehicle_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    session.delete(_get_or_404(session, vehicle_id))
    session.commit()


@router.post("/{vehicle_id}/restock", response_model=VehiclePublic)
def restock_vehicle(
    vehicle_id: int,
    data: QuantityRequest,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    vehicle = _get_or_404(session, vehicle_id)
    session.execute(
        update(Vehicle)
        .where(col(Vehicle.id) == vehicle_id)
        .values(stock=Vehicle.stock + data.quantity)
    )
    session.commit()
    session.refresh(vehicle)
    return vehicle


@router.post("/{vehicle_id}/purchase", response_model=VehiclePublic)
def purchase_vehicle(
    vehicle_id: int,
    data: QuantityRequest,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    vehicle = _get_or_404(session, vehicle_id)
    result = session.execute(
        update(Vehicle)
        .where(col(Vehicle.id) == vehicle_id, col(Vehicle.stock) >= data.quantity)
        .values(stock=Vehicle.stock - data.quantity)
    )
    if result.rowcount == 0:
        session.rollback()
        raise HTTPException(status_code=409, detail="Insufficient stock")
    session.commit()
    session.refresh(vehicle)
    return vehicle