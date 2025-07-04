from starlette import status
from app.models.todo import Todos
from app.api.v1.todos import get_db, GetCurrentUser
from app.services.repositeries import TodoRepository
from .utils import *

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[GetCurrentUser] = override_get_current_user

def test_read_all_authenticated(test_todo):
    response = client.get("/todos")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == [{
        'complete': False,
        'title': 'learn to code',
        'description': 'Need to learn everyday!',
        'id': 1,
        'owner_id': 1,
        'priority': 5
    }]

def test_read_one_authenticated(test_todo):
    response = client.get("/todos/todo/1")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        'complete': False,
        'title': 'learn to code',
        'description': 'Need to learn everyday!',
        'id': 1,
        'owner_id': 1,
        'priority': 5
    }

def test_read_one_authenticated_not_found():
    response = client.get("/todos/todo/999")
    assert response.status_code == 404
    assert response.json() == {"detail": "Id not found"}

def test_create_todo(test_todo):
    request = {
        'title': 'new Todo!',
        'description': 'New todo description',
        'priority': 5,
        'complete': False
    }

    response = client.post('/todos/todo/', json=request)
    assert response.status_code == 201

    db = TestingSessionLocal()
    todo_repo = TodoRepository(db)
    model = todo_repo.get_by_id_and_user(2, 1)
    assert model.title == request.get('title')
    assert model.description == request.get('description')
    assert model.priority == request.get('priority')
    assert model.complete == request.get('complete')

def test_update_todo(test_todo):
    request = {
        'title': 'Change the title you already saved',
        'description': 'Need to learn everyday!',
        'priority': 5,
        'complete': False
    }

    response = client.put('/todos/todo/update-todo/1', json=request)
    assert response.status_code == 200

    db = TestingSessionLocal()
    todo_repo = TodoRepository(db)
    model = todo_repo.get_by_id_and_user(1, 1)
    assert model.title == 'Change the title you already saved'
    assert model.description == 'Need to learn everyday!'
    assert model.priority == 5
    assert model.complete == False

def test_update_todo_not_found(test_todo):
    request = {
        'title': 'Change the title you already saved',
        'description': 'Need to learn everyday!',
        'priority': 5,
        'complete': False
    }
    response = client.put('/todos/todo/update-todo/999', json=request)
    assert response.status_code == 404
    assert response.json() == {"detail": "Id not found"}

def test_delete_todo(test_todo):
    response = client.delete('/todos/todo/1')
    assert response.status_code == 204
    db = TestingSessionLocal()
    todo_repo = TodoRepository(db)
    model = todo_repo.get_by_id_and_user(1, 1)
    assert model is None

def test_delete_todo_not_found(test_todo):
    response = client.delete('/todos/todo/999')
    assert response.status_code == 404
    assert response.json() == {"detail": "Id not found"}