from .utils import *
from ..app.api.v1.admin import get_db, GetCurrentUser
from fastapi import status
from ..app.models.todo import Todos

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[GetCurrentUser] = override_get_current_user

def test_admin_read_all_authenticated(test_todo: Todos):
    response = client.get("/admin/todo")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == [
        {'complete' : False, 'title' : 'learn to code', 
         'description' : 'Need to learn everyday!',
         'id' : 1,
         'priority' : 5, 'owner_id' : 1
         }
    ]

def test_admin_delete_todo(test_todo: Todos):
    response = client.delete("/admin/todo/1")
    assert response.status_code == 204

    db = TestingSessionLocal()
    model = db.query(Todos).filter(Todos.id == 1).first()
    assert model is None

def test_admin_delete_todo_not_found():
    response = client.delete("/admin/todo/9999")
    assert response.status_code == 404
    assert response.json() == {"detail": "Id not found."}  # Add period