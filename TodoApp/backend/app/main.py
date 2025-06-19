from fastapi import FastAPI
from core.database import Base
from core.database import engine
from api.v1 import admin
from api.v1 import auth
from api.v1 import todos
from api.v1 import users

app = FastAPI()

Base.metadata.create_all(bind= engine)

app.include_router(auth.router)
app.include_router(todos.router)
app.include_router(admin.router)
app.include_router(users.router)
























































