from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import Users
from app.schemas.auth import CreateUserRequest
from app.config.security import bcrypt_context

class AuthRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_by_username(self, username: str) -> Optional[Users]:
        """Get user by username"""
        return self.db.query(Users).filter(Users.username == username).first()
    
    def get_user_by_email_or_username(self, email: str, username: str) -> Optional[Users]:
        """Get user by email or username"""
        return self.db.query(Users).filter(
            (Users.email == email) | (Users.username == username)
        ).first()
    
    def authenticate_user(self, username: str, password: str) -> Optional[Users]:
        """Authenticate user with username and password"""
        user = self.get_user_by_username(username)
        if not user or not bcrypt_context.verify(password, user.hashed_password):
            return None
        return user
    
    def create_user(self, user_data: CreateUserRequest) -> Users:
        """Create a new user"""
        create_user_model = Users(
            email=user_data.email,
            username=user_data.username,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            role=user_data.role,
            hashed_password=bcrypt_context.hash(user_data.password),
            is_active=True,
            phone_number=user_data.phone_number
        )
        
        self.db.add(create_user_model)
        self.db.commit()
        self.db.refresh(create_user_model)
        return create_user_model