from .utils import *
from ..app.api.v1.users import get_db, GetCurrentUser
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
    response = client.put("/user/password", json = {"password": "t", "new_password" : "newpassword"})
    assert response.status_code == status.HTTP_204_NO_CONTENT

def test_change_password_invalid_current_password(test_user):
    response = client.put("/user/password", json = {"password": "wrongpassowrd", "new_password" : "newpassword"})
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json() == {'detail': 'User is not identified'}

def test_change_phone_number_success(test_user):
    response = client.put("/user/phonenumber/y")
    assert response.status_code == status.HTTP_204_NO_CONTENT