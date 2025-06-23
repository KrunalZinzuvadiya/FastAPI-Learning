import os
from fastapi import APIRouter, Request, Depends, HTTPException, Path
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import Annotated
from starlette import status
from starlette.responses import RedirectResponse
from app.schemas.todos import TodoRequest
from app.core.database import SessionLocal
from app.config.security import GetCurrentUser, GetCurrentUserFromRequest
from app.services.repositeries import TodoRepository

router = APIRouter(
    prefix='/todos',
    tags=['todos']
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(GetCurrentUser)]

def get_todo_repo(db: db_dependency):
    return TodoRepository(db)

todo_repo_dependency = Annotated[TodoRepository, Depends(get_todo_repo)]

templates = Jinja2Templates(directory=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "frontend", "templates")))

@router.get("/todo-page")
async def render_todo_page(request: Request, todo_repo: todo_repo_dependency):
    try:
        user = await GetCurrentUserFromRequest(request)
    except Exception:
        response = RedirectResponse(url='/auth/login-page', status_code=status.HTTP_302_FOUND)
        response.delete_cookie(key="access_token")
        return response
    
    if user is None:
        response = RedirectResponse(url='/auth/login-page', status_code=status.HTTP_302_FOUND)
        response.delete_cookie(key="access_token")
        return response
    
    todos = todo_repo.get_all_by_user_id(user.get('id'))
    return templates.TemplateResponse("todo.html", {"request": request, "todos": todos, "user": user})

@router.get("/")
async def read_all(user: user_dependency, todo_repo: todo_repo_dependency):
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Authentication failed')
    return todo_repo.get_all_by_user_id(user.get('id'))

@router.get("/todo/{todo_id}", status_code=status.HTTP_200_OK)
async def todo_by_id(user: user_dependency, todo_repo: todo_repo_dependency, todo_id: int = Path(gt=0)):
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Authentication failed')
    
    todo_model = todo_repo.get_by_id_and_user(todo_id, user.get('id'))
    if todo_model is not None:
        return todo_model
    raise HTTPException(status_code=404, detail='Id not found')

@router.post("/todo", status_code=status.HTTP_201_CREATED)
async def create_todo(user: user_dependency, todo_repo: todo_repo_dependency, todo_request: TodoRequest):
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Authentication failed')
    
    return todo_repo.create(todo_request.model_dump(), user.get('id'))

@router.put("/todo/update-todo/{todo_id}", status_code=status.HTTP_200_OK)
async def update_todo(user: user_dependency, todo_repo: todo_repo_dependency, todo_request: TodoRequest, todo_id: int = Path(gt=0)):
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Authentication failed')
    
    updated_todo = todo_repo.update(todo_id, user.get('id'), todo_request)
    if updated_todo is None:
        raise HTTPException(status_code=404, detail='Id not found')
    return updated_todo

@router.delete("/todo/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(user: user_dependency, todo_repo: todo_repo_dependency, todo_id: int = Path(gt=0)):
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Authentication failed')
    
    deleted = todo_repo.delete(todo_id, user.get('id'))
    if not deleted:
        raise HTTPException(status_code=404, detail='Id not found')
    return None