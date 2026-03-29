import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db
from main import app

TEST_DB_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
def client():
    return TestClient(app)


TEST_COACH_USER = os.environ.get("TEST_COACH_USER", "testcoach")
TEST_COACH_PASS = os.environ.get("TEST_COACH_PASS", "testpass123")
TEST_PARENT_USER = os.environ.get("TEST_PARENT_USER", "testparent")
TEST_PARENT_PASS = os.environ.get("TEST_PARENT_PASS", "testpass456")


@pytest.fixture
def coach_token(client):
    client.post("/api/auth/register", json={"username": TEST_COACH_USER, "password": TEST_COACH_PASS, "role": "coach"})
    resp = client.post("/api/auth/login", json={"username": TEST_COACH_USER, "password": TEST_COACH_PASS})
    return resp.json()["access_token"]


@pytest.fixture
def parent_token(client):
    client.post("/api/auth/register", json={"username": TEST_PARENT_USER, "password": TEST_PARENT_PASS, "role": "parent"})
    resp = client.post("/api/auth/login", json={"username": TEST_PARENT_USER, "password": TEST_PARENT_PASS})
    return resp.json()["access_token"]


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}
