from datetime import datetime, timedelta, timezone
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session 
from starlette import status
from app.schemas.auth import CreateUserRequest, Token
from app.core.database import SessionLocal
from app.models.user import Users
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError

router = APIRouter(
     prefix='/auth',
     tags = ['auth']
)

SECRET_KEY = 'e7a6b0d1a405cacfbb7e9153a0d6195dc2b588b096bb4c4054d8a7bd5a543204' #openssl rand -hex 32
ALGORITHM = 'HS256'

bcrypt_context = CryptContext(schemes = ['bcrypt'], deprecated = 'auto')
oauth2Bearer = OAuth2PasswordBearer(tokenUrl='auth/token')

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

def AuthenticateUser(username: str, password: str, db):
     user = db.query(Users).filter(Users.username == username).first()
     if not user:
          return False
     if not bcrypt_context.verify(password, user.hashed_password):
          return False
     return user

def CreateAccessToken(username: str, user_id: int, role: str, expire_delta: timedelta):
     encode = {'sub': username, 'id': user_id, 'role': role}
     expires = datetime.now(timezone.utc) + expire_delta
     encode.update({'exp': expires})
     return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)


async def GetCurrentUser(token: Annotated[str, Depends(oauth2Bearer)]):
     try:
          payload = jwt.decode(token, SECRET_KEY, algorithms=ALGORITHM)
          username: str = payload.get('sub')
          user_id: str = payload.get('id')
          user_role: str = payload.get('role')
          if username is None or user_id is None:
               raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = 'Could not validate user.')
          return {'username': username, 'id': user_id, 'user_role': user_role}
     except JWTError:
          raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = 'Could not validate user.')

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_user(db: db_dependency, 
                      create_user_request: CreateUserRequest):
        # Check if user with same email or username already exists
        existing_user = db.query(Users).filter(
            (Users.email == create_user_request.email) | 
            (Users.username == create_user_request.username)
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email or username already registered"
            )

        create_user_model = Users(
            email = create_user_request.email,
            username = create_user_request.username,
            first_name = create_user_request.first_name,
            last_name = create_user_request.last_name,
            role = create_user_request.role,
            hashed_password = bcrypt_context.hash(create_user_request.password),
            is_active = True,
            phone_number = create_user_request.phone_number
        )

        db.add(create_user_model)
        db.commit()
        db.refresh(create_user_model)
        
        return {"message": "User created successfully", "user_id": create_user_model.id}

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
                                 db: db_dependency):
     user = AuthenticateUser(form_data.username, form_data.password, db)
     if not user:
          raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = 'Could not validate user.')
     token = CreateAccessToken(user.username, user.id, user.role,timedelta(minutes=20))
     return {'access_token' : token, 'token_type': 'bearer'}