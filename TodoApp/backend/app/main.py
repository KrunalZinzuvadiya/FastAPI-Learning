from fastapi import FastAPI, Request
from app.core.database import Base
from app.core.database import engine
from app.api.v1 import admin
from app.api.v1 import auth
from app.api.v1 import todos
from app.api.v1 import users
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse
import os
from pathlib import Path
from fastapi.staticfiles import StaticFiles

app = FastAPI()

Base.metadata.create_all(bind= engine)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

STATIC_PATH = PROJECT_ROOT / "frontend" / "static"
TEMPLATE_PATH = PROJECT_ROOT / "frontend" / "templates"

app.mount("/static", StaticFiles(directory=STATIC_PATH), name="static")

templates = Jinja2Templates(directory=TEMPLATE_PATH)

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    # Check if user is authenticated by validating the token
    try:
        user = await auth.GetCurrentUserFromRequest(request)
        if user:
            # User is authenticated, redirect to todo page
            return RedirectResponse(url="/todos/todo-page", status_code=302)
        else:
            # User is not authenticated, redirect to login page
            return RedirectResponse(url="/auth/login-page", status_code=302)
    except Exception:
        # Any error in token validation, redirect to login page
        return RedirectResponse(url="/auth/login-page", status_code=302)

app.include_router(auth.router)
app.include_router(todos.router)
app.include_router(admin.router)
app.include_router(users.router)
























































