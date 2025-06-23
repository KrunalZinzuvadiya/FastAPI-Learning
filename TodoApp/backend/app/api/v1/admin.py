from fastapi import APIRouter, Depends, HTTPException, Path, Request
from sqlalchemy.orm import Session
from typing import Annotated
from starlette import status
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse
import os
from app.core.database import SessionLocal
from app.config.security import GetCurrentUser, GetCurrentUserFromRequest
from app.services.repositeries import TodoRepository

router = APIRouter(
    prefix='/admin',
    tags=['admin']
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

@router.get("/admin-page", response_class=HTMLResponse)
async def render_admin_page(request: Request):
    try:
        user = await GetCurrentUserFromRequest(request)
        if not user or user.get('user_role') != 'admin':
            return templates.TemplateResponse("unauthorized.html", {"request": request}, status_code=403)
    except Exception:
        return RedirectResponse(url="/auth/login-page", status_code=302)
    
    return templates.TemplateResponse("admin.html", {"request": request})

@router.get("/todo", status_code=status.HTTP_200_OK)
async def read_all(user: user_dependency, todo_repo: todo_repo_dependency):
    if user is None or user.get('user_role') != 'admin':
        raise HTTPException(status_code=401, detail='Authentication Failed')
    return todo_repo.get_all()

@router.delete("/todo/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(user: user_dependency, todo_repo: todo_repo_dependency, todo_id: int = Path(gt=0)):
    if user is None or user.get('user_role') != 'admin':
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    success = todo_repo.delete_by_id(todo_id)
    if not success:
        raise HTTPException(status_code=404, detail='Id not found.')
    return None


