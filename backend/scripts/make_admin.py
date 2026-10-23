import sys

from sqlmodel import Session, select

from app.database import engine
from app.models import User


if len(sys.argv) != 2:
    sys.exit("Usage: python -m scripts.make_admin EMAIL")

with Session(engine) as session:
    user = session.exec(select(User).where(User.email == sys.argv[1])).first()
    if user is None:
        sys.exit("User not found")

    user.role = "admin"
    session.add(user)
    session.commit()
    print(f"{user.email} is now an admin")