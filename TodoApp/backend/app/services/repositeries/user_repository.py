from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import Users
from app.config.security import bcrypt_context

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_id(self, user_id: int) -> Optional[Users]:
        """Get user by ID"""
        return self.db.query(Users).filter(Users.id == user_id).first()

    def change_password(self, user_id: int, old_password: str, new_password: str) -> bool:
        """Update user password after verifying the old password"""
        user = self.get_user_by_id(user_id)
        if not user or not bcrypt_context.verify(old_password, user.hashed_password):
            return False
        
        user.hashed_password = bcrypt_context.hash(new_password)
        self.db.add(user)
        self.db.commit()
        return True

    def update_user_phone(self, user_id: int, phone_number: str) -> bool:
        """Update user phone number"""
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        
        user.phone_number = phone_number
        self.db.add(user)
        self.db.commit()
        return True 