from fastapi import APIRouter
from fastapi import Depends, HTTPException, Path
from pydantic import BaseModel, Field
from app.core.database import SessionLocal
from sqlalchemy.orm import Session
from typing import Annotated
from app.models.todo import Todos
from app.models.user import Users
from starlette import status
from app.api.v1.auth import GetCurrentUser
from passlib.context import CryptContext

router = APIRouter(
    prefix='/user',
     tags = ['user']
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(GetCurrentUser)]

bcrypt_context = CryptContext(schemes = ['bcrypt'], deprecated = 'auto')

class UserVerification(BaseModel):
    password: str
    new_password: str = Field(min_length=6)

@router.get("/", status_code=status.HTTP_200_OK)
async def read_all(user: user_dependency, db:db_dependency):
    if user is None:
        raise HTTPException(status_code=401, detail = 'Authentication Failed')
    return db.query(Users).filter(Users.id == user.get('id')).first()

@router.put("/password", status_code=status.HTTP_204_NO_CONTENT)
async def ChangePassword(user: user_dependency, db: db_dependency,
                         user_verification: UserVerification):
    if user is None:
        raise HTTPException(status_code=401, detail = 'Authentication Failed')
    user_model = db.query(Users).filter(Users.id == user.get('id')).first()

    if not bcrypt_context.verify(user_verification.password, user_model.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = 'User is not identified')
    user_model.hashed_password = bcrypt_context.hash(user_verification.new_password)
    db.add(user_model)
    db.commit()

@router.put("/phonenumber/{phone_number}", status_code=status.HTTP_204_NO_CONTENT)
async def UpdatePhoneNumber(user: user_dependency, db: db_dependency, phone_number: str):
    if user is None:
        raise HTTPException(status_code=401, detail = 'Authentication Failed')
    user_model = db.query(Users).filter(Users.id == user.get('id')).first()
    user_model.phone_number = phone_number    
    db.add(user_model)
    db.commit()

