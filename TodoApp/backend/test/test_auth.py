from .utils import *
from app.api.v1.auth import get_db, AuthenticateUser,CreateAccessToken, SECRET_KEY, ALGORITHM, GetCurrentUser
from jose import jwt
from datetime import timedelta
from fastapi import HTTPException

app.dependency_overrides[get_db] = override_get_db

def test_authenticate_user(test_user):
    db = TestingSessionLocal()

    authenticated_user = AuthenticateUser(test_user.username, 't', db)
    assert authenticated_user is not None
    assert authenticated_user.username == test_user.username

    non_existent_user = AuthenticateUser('wrong_username', 'wrongpassowrd', db)
    assert non_existent_user is False

    wrong_password_user = AuthenticateUser(test_user.username, 'wrongpassword', db)
    assert wrong_password_user is False

def test_create_access_token():
    username = 't'
    user_id = 1
    role = 'admin'
    expires_delta = timedelta(days = 1)

    token = CreateAccessToken(username, user_id, role, expires_delta)

    decoded_token = jwt.decode(token, SECRET_KEY, algorithms = [ALGORITHM],
                               options = {'verify_signature': False})
    
    assert decoded_token['sub'] == username
    assert decoded_token['id'] == user_id
    assert decoded_token['role'] == role

@pytest.mark.asyncio
async def test_create_user_token():
    encode = {'sub': 't', 'id': 1, 'role': 'admin'}
    token = jwt.encode(encode, SECRET_KEY, ALGORITHM)

    user = await GetCurrentUser(token = token)
    assert user == {'username': 't', 'id': 1, 'user_role':'admin'}

@pytest.mark.asyncio
async def test_get_current_user_missing_payload():
    encode = {'role':'user'}
    token = jwt.encode(encode, SECRET_KEY, ALGORITHM)

    with pytest.raises(HTTPException) as excinfo:
        await GetCurrentUser(token = token)
    
    assert excinfo.value.status_code == 401
    assert excinfo.value.detail == 'Could not validate user.'


    
