# DriveLot — Car Dealership Inventory System

DriveLot is a full-stack car inventory application with JWT authentication, vehicle search, stock purchases, and admin inventory controls.

## Live application

- **Use the app:** https://ai-kata-car-dealership.vercel.app/
- **API documentation:** https://driverlot-api.onrender.com/docs
- **Source code:** https://github.com/chirag2005xx/ai_KATA_CAR_DEALERSHIP

The React frontend is deployed on Vercel, the FastAPI backend on Render, and the production PostgreSQL database on Neon. The complete application is available online. Register a new account to browse, search, and purchase vehicles. Public registration creates a normal user; admin access is assigned separately.

The free backend may take a short time to respond after inactivity.

## Tech stack

- Backend: FastAPI, SQLModel, PyJWT, pwdlib
- Databases: SQLite for local development and tests; Neon PostgreSQL in production
- Frontend: React, Vite, Tailwind CSS
- Tests: pytest with temporary file-backed SQLite databases
- Hosting: Vercel and Render

## Features

- Register and log in
- Browse and filter vehicles by make, model, category, and price range
- Purchase vehicles while stock is available
- Admin controls for adding, editing, deleting, and restocking vehicles
- Protected API endpoints and admin-only authorization

The API calls the stock quantity `stock`. Local SQLite data is stored in `backend/app.db`, which is excluded from Git.

## Run locally

Requirements: Python 3.12+ and Node.js/npm.

### Backend

Open a PowerShell terminal in `backend`:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
$env:JWT_SECRET = python -c "import secrets; print(secrets.token_urlsafe(48))"
python -m uvicorn app.main:app --reload
```

Local API documentation: http://127.0.0.1:8000/docs

Keep this terminal open. Set `JWT_SECRET` again in each new backend terminal session. Do not commit real secrets or database connection strings. Without `DATABASE_URL`, the backend uses local SQLite; production supplies a PostgreSQL `DATABASE_URL`.

### Frontend

Open a second terminal in `frontend`:

```powershell
npm install
npm run dev
```

Open http://localhost:5173. The frontend uses `http://localhost:8000` by default. Set `VITE_API_URL` if you need it to call a different backend.

### Admin access

Register an account first. Public registration always creates a normal user. To grant admin access in the deployed app, an operator can update that existing account's `role` to `admin` in the production database. Do not expose an endpoint that lets users assign their own roles.

For a local SQLite account, run this from `backend`, replacing the example email:

```powershell
.\.venv\Scripts\python.exe -c "from app.database import engine; from app.models import User; from sqlmodel import Session, select; session = Session(engine); user = session.exec(select(User).where(User.email == 'registered@example.com')).one(); user.role = 'admin'; session.add(user); session.commit(); session.close()"
```

Refresh the app or log out and back in to see the admin controls.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Log in and receive a JWT |
| GET | `/api/auth/me` | Current user |
| POST | `/api/vehicles` | Add a vehicle |
| GET | `/api/vehicles` | List vehicles |
| GET | `/api/vehicles/search` | Filter vehicles |
| PUT | `/api/vehicles/{id}` | Replace vehicle details |
| PATCH | `/api/vehicles/{id}` | Partially update vehicle details |
| DELETE | `/api/vehicles/{id}` | Delete, admin only |
| POST | `/api/vehicles/{id}/purchase` | Decrease stock |
| POST | `/api/vehicles/{id}/restock` | Increase stock, admin only |

Vehicle routes require a bearer token. Purchase and restock accept a JSON body such as `{"quantity": 1}`.

## Tests

From `backend`, run:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

Latest verified local backend run: **24 passed, 1 deprecation warning**. See the [test report](test-report.txt). The warning comes from the installed FastAPI/Starlette test client dependency.

## Screenshots

![Inventory and admin controls](screenshots/inventory.png)

![Login](screenshots/login.png)

## My AI Usage

I used **Claude** to help draft tests, backend and frontend code, and implementation guidance,to help debug deployment, connect the Vercel frontend to the Render API, check the live workflow, and update the documentation. I integrated and reviewed the code, ran the tests locally, fixed errors, and manually checked registration, admin access, purchase, and restock.

AI helped me move quickly and identify gaps, but its output needed checking against the assignment. For example, an initial vehicle implementation omitted required fields and endpoints, so I added tests for those requirements before completing the API.

The raw AI conversation logs or public chat links are in [PROMPTS.md](PROMPTS.md).