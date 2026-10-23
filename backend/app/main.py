from fastapi import FastAPI

from app.routers.auth import router as auth_router
from app.routers.vehicles import router as vehicles_router

app = FastAPI()
app.include_router(auth_router)
app.include_router(vehicles_router)