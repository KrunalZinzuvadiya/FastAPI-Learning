from fastapi import FastAPI
from app.core.database import Base
from app.core.database import engine
from app.api.v1 import admin
from app.api.v1 import auth
from app.api.v1 import todos
from app.api.v1 import users

app = FastAPI()

Base.metadata.create_all(bind= engine)

app.include_router(auth.router)
app.include_router(todos.router)
app.include_router(admin.router)
app.include_router(users.router)
























































