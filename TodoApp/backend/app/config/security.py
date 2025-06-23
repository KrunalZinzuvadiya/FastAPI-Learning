from datetime import datetime, timedelta, timezone
from typing import Annotated
from fastapi import Depends, HTTPException, Request
from starlette import status
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
import os
from dotenv import load_dotenv

load_dotenv()

# Security constants
SECRET_KEY = os.getenv("JWT_SECRET_KEY") #openssl rand -hex 32
ALGORITHM = os.getenv("JWT_ALGORITHM")

# Security utilities
bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
oauth2Bearer = OAuth2PasswordBearer(tokenUrl='auth/token')

def CreateAccessToken(username: str, user_id: int, role: str, expire_delta: timedelta):
     encode = {'sub': username, 'id': user_id, 'role': role}
     expires = datetime.now(timezone.utc) + expire_delta
     encode.update({'exp': expires})
     return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)

async def GetCurrentUser(token: Annotated[str, Depends(oauth2Bearer)]):
     try:
          payload = jwt.decode(token, SECRET_KEY, algorithms=ALGORITHM)
          username: str = payload.get('sub')
          user_id: str = payload.get('id')
          user_role: str = payload.get('role')
          if username is None or user_id is None:
               raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = 'Could not validate user.')
          return {'username': username, 'id': user_id, 'user_role': user_role}
     except JWTError:
          raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = 'Could not validate user.')

async def GetCurrentUserFromRequest(request: Request):
     try:
          # Try to get token from Authorization header
          auth_header = request.headers.get('Authorization')
          if auth_header and auth_header.startswith('Bearer '):
               token = auth_header.split(' ')[1]
          else:
               # Try to get token from cookies
               token = request.cookies.get('access_token')
          
          if not token:
               return None
          
          payload = jwt.decode(token, SECRET_KEY, algorithms=ALGORITHM)
          username: str = payload.get('sub')
          user_id: str = payload.get('id')
          user_role: str = payload.get('role')
          if username is None or user_id is None:
               return None
          return {'username': username, 'id': user_id, 'user_role': user_role}
     except JWTError:
          return None