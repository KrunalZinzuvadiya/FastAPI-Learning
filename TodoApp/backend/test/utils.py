from sqlalchemy import StaticPool, create_engine, text
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from ..app.core.database import Base
from ..app.models.todo import Todos
from ..app.models.user import Users
from ..app.main import app
from ..app.api.v1.auth import bcrypt_context
import pytest


SQLALCHEMY_DATABASE_URL = "sqlite:///../testdb.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass = StaticPool, 
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush = False, bind = engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

def override_get_current_user():
    return {
        "username": "testuser",
        "user_id": 1,
        "user_role": "admin"
    }

client = TestClient(app)

@pytest.fixture
def test_todo():
    todo = Todos(
        title = 'learn to code',
        description = 'Need to learn everyday!',
        priority = 5,
        complete = False,
        owner_id = 1
    )

    db = TestingSessionLocal()
    db.add(todo)
    db.commit()
    yield todo
    with engine.connect() as connection:
        connection.execute(text("DELETE FROM todos;"))
        connection.commit()


@pytest.fixture
def test_user():
    user = Users(
        username = "t",
        email = "t",
        first_name = "t",
        last_name = "t",
        hashed_password = bcrypt_context.hash("t"),
        role = "admin",
        phone_number = "t"
    )

    db = TestingSessionLocal()
    db.add(user)
    db.commit()
    yield user
    with engine.connect() as connection:
        connection.execute(text("DELETE FROM users;"))
        connection.commit()

