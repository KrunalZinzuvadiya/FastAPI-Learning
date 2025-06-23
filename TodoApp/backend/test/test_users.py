from .utils import *
from app.api.v1.users import get_db, GetCurrentUser
from app.services.repositeries import UserRepository
from fastapi import status

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[GetCurrentUser] = override_get_current_user

def test_return_user(test_user):
    response = client.get("/user")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()['username'] == 't'
    assert response.json()['email'] == 't'
    assert response.json()['first_name'] == 't'
    assert response.json()['last_name'] == 't'
    assert response.json()['role'] == 'admin'
    assert response.json()['phone_number'] == 't'

def test_change_password_success(test_user):
    response = client.put("/user/password", json={"password": "t", "new_password": "newpassword"})
    assert response.status_code == status.HTTP_204_NO_CONTENT

def test_change_password_invalid_current_password(test_user):
    response = client.put("/user/password", json={"password": "wrongpassword", "new_password": "newpassword"})
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json() == {'detail': 'User is not identified'}

def test_change_phone_number_success(test_user):
    response = client.put("/user/phonenumber/y")
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify the phone number was updated using repository
    db = TestingSessionLocal()
    user_repo = UserRepository(db)
    updated_user = user_repo.get_user_by_id(1)
    assert updated_user.phone_number == 'y'