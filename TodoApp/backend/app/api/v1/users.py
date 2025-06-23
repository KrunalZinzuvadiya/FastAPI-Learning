from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Annotated
from starlette import status
from app.core.database import SessionLocal
from app.config.security import GetCurrentUser
from app.services.repositeries import UserRepository

router = APIRouter(
    prefix='/user',
    tags=['user']
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(GetCurrentUser)]

def get_user_repo(db: db_dependency):
    return UserRepository(db)

user_repo_dependency = Annotated[UserRepository, Depends(get_user_repo)]

class UserVerification(BaseModel):
    password: str
    new_password: str = Field(min_length=6)

@router.get("/", status_code=status.HTTP_200_OK)
async def get_user(user: user_dependency, user_repo: user_repo_dependency):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    current_user = user_repo.get_user_by_id(user.get('id'))
    if not current_user:
        raise HTTPException(status_code=404, detail='User not found')
    return current_user

@router.put("/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    user: user_dependency, 
    user_repo: user_repo_dependency,
    user_verification: UserVerification
):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    success = user_repo.change_password(
        user.get('id'), 
        user_verification.password,
        user_verification.new_password
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User is not identified')
    return None

@router.put("/phonenumber/{phone_number}", status_code=status.HTTP_204_NO_CONTENT)
async def update_phone_number(user: user_dependency, user_repo: user_repo_dependency, phone_number: str):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
        
    success = user_repo.update_user_phone(user.get('id'), phone_number)
    if not success:
        raise HTTPException(status_code=404, detail='User not found')
    return None

