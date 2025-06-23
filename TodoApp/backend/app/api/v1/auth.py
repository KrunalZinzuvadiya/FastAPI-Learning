from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from starlette import status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.templating import Jinja2Templates
import os
from fastapi.responses import RedirectResponse
from app.schemas.auth import CreateUserRequest, Token
from app.core.database import SessionLocal
from app.services.repositeries import AuthRepository
from app.config.security import (
    CreateAccessToken,
    GetCurrentUser,
    GetCurrentUserFromRequest,
)

router = APIRouter(
    prefix='/auth',
    tags=['auth']
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

def get_auth_repo(db: db_dependency):
    return AuthRepository(db)

auth_repo_dependency = Annotated[AuthRepository, Depends(get_auth_repo)]

templates = Jinja2Templates(directory=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "frontend", "templates")))

@router.get("/login-page")
async def render_login_page(request: Request):
    try:
        user = await GetCurrentUserFromRequest(request)
        if user:
            return RedirectResponse(url="/todos/todo-page", status_code=302)
    except Exception:
        pass
    return templates.TemplateResponse("login.html", {"request": request})

@router.get("/register-page")
def render_register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

@router.get("/logout")
def logout(request: Request):
    response = RedirectResponse(url="/auth/login-page", status_code=302)
    response.delete_cookie(key="access_token")
    return response

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_user(auth_repo: auth_repo_dependency, create_user_request: CreateUserRequest):
    existing_user = auth_repo.get_user_by_email_or_username(
        create_user_request.email, create_user_request.username
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )
    
    new_user = auth_repo.create_user(create_user_request)
    return {"message": "User created successfully", "user_id": new_user.id}

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    auth_repo: auth_repo_dependency
):
    user = auth_repo.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Could not validate user.')
    
    token = CreateAccessToken(user.username, user.id, user.role, timedelta(minutes=20))
    return {'access_token': token, 'token_type': 'bearer'}