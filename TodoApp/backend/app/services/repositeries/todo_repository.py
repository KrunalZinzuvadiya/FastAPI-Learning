from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.todo import Todos
from app.schemas.todos import TodoRequest

class TodoRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_all_by_user_id(self, user_id: int) -> List[Todos]:
        """Get all todos for a specific user"""
        return self.db.query(Todos).filter(Todos.owner_id == user_id).all()
    
    def get_by_id_and_user(self, todo_id: int, user_id: int) -> Optional[Todos]:
        """Get a specific todo by ID and user ID"""
        return self.db.query(Todos).filter(
            Todos.id == todo_id,
            Todos.owner_id == user_id
        ).first()
    
    def create(self, todo_data: dict, user_id: int) -> Todos:
        """Create a new todo"""
        todo_model = Todos(**todo_data, owner_id=user_id)
        self.db.add(todo_model)
        self.db.commit()
        self.db.refresh(todo_model)
        return todo_model
    
    def update(self, todo_id: int, user_id: int, todo_data: TodoRequest) -> Optional[Todos]:
        """Update an existing todo"""
        todo_model = self.get_by_id_and_user(todo_id, user_id)
        if not todo_model:
            return None
        
        todo_model.title = todo_data.title
        todo_model.description = todo_data.description
        todo_model.priority = todo_data.priority
        todo_model.complete = todo_data.complete
        
        self.db.add(todo_model)
        self.db.commit()
        self.db.refresh(todo_model)
        return todo_model
    
    def delete(self, todo_id: int, user_id: int) -> bool:
        """Delete a todo"""
        todo_model = self.get_by_id_and_user(todo_id, user_id)
        if not todo_model:
            return False
        
        self.db.query(Todos).filter(
            Todos.id == todo_id,
            Todos.owner_id == user_id
        ).delete()
        self.db.commit()
        return True
    
    def get_all(self) -> List[Todos]:
        """Get all todos (for admin use)"""
        return self.db.query(Todos).all()
    
    def delete_by_id(self, todo_id: int) -> bool:
        """Delete a todo by ID (for admin use)"""
        todo_model = self.db.query(Todos).filter(Todos.id == todo_id).first()
        if not todo_model:
            return False
        
        self.db.query(Todos).filter(Todos.id == todo_id).delete()
        self.db.commit()
        return True