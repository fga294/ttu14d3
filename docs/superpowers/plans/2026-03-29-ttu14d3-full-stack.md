# TTU14D3 Full-Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack soccer team management app (Thornleigh Thunder U14 Div 3) with role-based access — Coach gets full CRUD, Parent/Player gets read-only.

**Architecture:** FastAPI backend with SQLAlchemy ORM serving a REST API under `/api/`, consumed by a React + Vite frontend. JWT auth with role-based route guards. MariaDB in production, SQLite for local dev. Frontend uses TanStack Table for data grids, Recharts for POTM leaderboard, React Hook Form + Zod for forms.

**Tech Stack:** Python 3.13, FastAPI, SQLAlchemy, Pydantic, PyJWT, passlib | React 18, Vite, Tailwind CSS, TanStack Table, Recharts, React Hook Form, Zod, React Router

---

## File Structure

```
backend/
  main.py              # FastAPI app, CORS, router mounts
  database.py          # SQLAlchemy engine, SessionLocal, Base
  models.py            # ORM models: User, Player, Game, GameEvent, Fitness, POTM, Message
  schemas.py           # Pydantic request/response schemas
  auth.py              # JWT encode/decode, login/register endpoints
  deps.py              # get_current_user, require_coach dependencies
  routes/
    __init__.py
    players.py         # /api/players CRUD
    games.py           # /api/games CRUD
    game_events.py     # /api/games/{id}/events CRUD
    fitness.py         # /api/fitness CRUD
    potm.py            # /api/potm vote + leaderboard
    messages.py        # /api/messages CRUD + approve
  seed.py              # Populate DB with sample data
  requirements.txt
  tests/
    __init__.py
    conftest.py        # Test client, test DB fixtures
    test_auth.py
    test_players.py
    test_games.py

frontend/
  package.json
  vite.config.js
  tailwind.config.js
  postcss.config.js
  index.html
  src/
    main.jsx
    App.jsx
    index.css
    api/
      client.js        # fetch wrapper with JWT header
    context/
      AuthContext.jsx   # Login state, token storage
    components/
      Layout.jsx       # Sidebar nav + top bar + content area
      ProtectedRoute.jsx
      DataTable.jsx    # Reusable TanStack Table
    pages/
      Login.jsx
      Dashboard.jsx
      Players.jsx
      PlayerDetail.jsx
      Games.jsx
      GameDetail.jsx
      Leaderboard.jsx
      Messages.jsx
```

---

## Task 1: Backend — Database & Models

**Files:**
- Create: `backend/database.py`
- Create: `backend/models.py`
- Create: `backend/requirements.txt`

- [ ] **Step 1: Create `requirements.txt`**

```
fastapi==0.115.0
uvicorn[standard]==0.30.6
sqlalchemy==2.0.35
pymysql==1.1.1
cryptography==43.0.1
pydantic[email]==2.9.2
pyjwt==2.9.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.1
gunicorn==23.0.0
pytest==8.3.3
httpx==0.27.2
```

- [ ] **Step 2: Create `database.py`**

```python
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "")
DB_USER = os.getenv("DB_USER", "")
DB_PASS = os.getenv("DB_PASS", "")
DB_NAME = os.getenv("DB_NAME", "ttu14_db")

if DB_HOST:
    DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"
else:
    DATABASE_URL = "sqlite:///./ttu14.db"

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 3: Create `models.py`**

```python
from datetime import date, datetime
from sqlalchemy import Boolean, Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base
import enum


class Role(str, enum.Enum):
    coach = "coach"
    parent = "parent"
    player = "player"


class EventType(str, enum.Enum):
    goal = "goal"
    assist = "assist"
    yellow_card = "yellow_card"
    red_card = "red_card"


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.parent)


class Player(Base):
    __tablename__ = "players"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    position: Mapped[str] = mapped_column(String(30), nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    events: Mapped[list["GameEvent"]] = relationship(back_populates="player")
    fitness_records: Mapped[list["Fitness"]] = relationship(back_populates="player")
    potm_awards: Mapped[list["POTM"]] = relationship(back_populates="player")


class Game(Base):
    __tablename__ = "games"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    opponent: Mapped[str] = mapped_column(String(100), nullable=False)
    location: Mapped[str] = mapped_column(String(150), nullable=True)
    home_away: Mapped[str] = mapped_column(String(4), default="home")
    our_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    their_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    events: Mapped[list["GameEvent"]] = relationship(back_populates="game")
    potm: Mapped["POTM | None"] = relationship(back_populates="game")


class GameEvent(Base):
    __tablename__ = "game_events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"), nullable=False)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id"), nullable=False)
    event_type: Mapped[EventType] = mapped_column(Enum(EventType), nullable=False)
    minute: Mapped[int | None] = mapped_column(Integer, nullable=True)
    game: Mapped["Game"] = relationship(back_populates="events")
    player: Mapped["Player"] = relationship(back_populates="events")


class Fitness(Base):
    __tablename__ = "fitness"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    rating: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    player: Mapped["Player"] = relationship(back_populates="fitness_records")


class POTM(Base):
    __tablename__ = "potm"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"), nullable=False)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id"), nullable=False)
    game: Mapped["Game"] = relationship(back_populates="potm")
    player: Mapped["Player"] = relationship(back_populates="potm_awards")
    __table_args__ = (UniqueConstraint("game_id", name="uq_potm_game"),)


class Message(Base):
    __tablename__ = "messages"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    author: Mapped[str] = mapped_column(String(100), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    approved: Mapped[bool] = mapped_column(Boolean, default=False)
```

- [ ] **Step 4: Install dependencies and verify models load**

Run: `cd backend && pip install -r requirements.txt && python -c "from models import *; print('Models OK')"`
Expected: All packages install, prints "Models OK"

- [ ] **Step 5: Commit**

```bash
git add backend/requirements.txt backend/database.py backend/models.py
git commit -m "feat: add database config and SQLAlchemy models"
```

---

## Task 2: Backend — Pydantic Schemas

**Files:**
- Create: `backend/schemas.py`

- [ ] **Step 1: Create `schemas.py`**

```python
from datetime import date, datetime
from pydantic import BaseModel, Field
from models import EventType, Role


# --- Auth ---
class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6)
    role: Role = Role.parent


class UserOut(BaseModel):
    id: int
    username: str
    role: Role
    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class LoginRequest(BaseModel):
    username: str
    password: str


# --- Player ---
class PlayerCreate(BaseModel):
    name: str = Field(max_length=100)
    number: int = Field(ge=1, le=99)
    position: str = Field(max_length=30)
    date_of_birth: date | None = None


class PlayerOut(BaseModel):
    id: int
    name: str
    number: int
    position: str
    date_of_birth: date | None
    model_config = {"from_attributes": True}


class PlayerStats(PlayerOut):
    goals: int = 0
    assists: int = 0
    yellow_cards: int = 0
    red_cards: int = 0
    avg_fitness: float | None = None
    potm_count: int = 0


# --- Game ---
class GameCreate(BaseModel):
    date: date
    opponent: str = Field(max_length=100)
    location: str | None = None
    home_away: str = Field(default="home", pattern="^(home|away)$")
    our_score: int | None = None
    their_score: int | None = None


class GameOut(BaseModel):
    id: int
    date: date
    opponent: str
    location: str | None
    home_away: str
    our_score: int | None
    their_score: int | None
    model_config = {"from_attributes": True}


# --- Game Event ---
class GameEventCreate(BaseModel):
    player_id: int
    event_type: EventType
    minute: int | None = None


class GameEventOut(BaseModel):
    id: int
    game_id: int
    player_id: int
    event_type: EventType
    minute: int | None
    model_config = {"from_attributes": True}


# --- Fitness ---
class FitnessCreate(BaseModel):
    player_id: int
    date: date
    rating: float = Field(ge=1, le=10)
    notes: str | None = None


class FitnessOut(BaseModel):
    id: int
    player_id: int
    date: date
    rating: float
    notes: str | None
    model_config = {"from_attributes": True}


# --- POTM ---
class POTMCreate(BaseModel):
    game_id: int
    player_id: int


class POTMOut(BaseModel):
    id: int
    game_id: int
    player_id: int
    model_config = {"from_attributes": True}


class POTMLeaderboard(BaseModel):
    player_id: int
    player_name: str
    count: int


# --- Message ---
class MessageCreate(BaseModel):
    author: str = Field(max_length=100)
    content: str


class MessageOut(BaseModel):
    id: int
    author: str
    content: str
    created_at: datetime
    approved: bool
    model_config = {"from_attributes": True}
```

- [ ] **Step 2: Verify schemas load**

Run: `cd backend && python -c "from schemas import *; print('Schemas OK')"`
Expected: Prints "Schemas OK"

- [ ] **Step 3: Commit**

```bash
git add backend/schemas.py
git commit -m "feat: add Pydantic request/response schemas"
```

---

## Task 3: Backend — Auth (JWT + Dependencies)

**Files:**
- Create: `backend/auth.py`
- Create: `backend/deps.py`

- [ ] **Step 1: Create `auth.py`**

```python
import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import jwt

from database import get_db
from models import User, Role
from schemas import LoginRequest, Token, UserCreate, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-change-in-production!")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username taken")
    user = User(
        username=payload.username,
        password_hash=pwd_context.hash(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not pwd_context.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return Token(access_token=token, role=user.role.value)
```

- [ ] **Step 2: Create `deps.py`**

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from auth import decode_access_token
from database import get_db
from models import User

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_access_token(credentials.credentials)
    user = db.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_coach(user: User = Depends(get_current_user)) -> User:
    if user.role.value != "coach":
        raise HTTPException(status_code=403, detail="Coach access required")
    return user
```

- [ ] **Step 3: Verify imports work**

Run: `cd backend && python -c "from auth import router; from deps import get_current_user, require_coach; print('Auth OK')"`
Expected: Prints "Auth OK"

- [ ] **Step 4: Commit**

```bash
git add backend/auth.py backend/deps.py
git commit -m "feat: add JWT auth with login/register and role dependencies"
```

---

## Task 4: Backend — API Routes

**Files:**
- Create: `backend/routes/__init__.py`
- Create: `backend/routes/players.py`
- Create: `backend/routes/games.py`
- Create: `backend/routes/game_events.py`
- Create: `backend/routes/fitness.py`
- Create: `backend/routes/potm.py`
- Create: `backend/routes/messages.py`

- [ ] **Step 1: Create `routes/__init__.py`**

```python
```

(Empty file — just marks the package.)

- [ ] **Step 2: Create `routes/players.py`**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Player, GameEvent, EventType, Fitness, POTM
from schemas import PlayerCreate, PlayerOut, PlayerStats
from deps import get_current_user, require_coach

router = APIRouter(prefix="/api/players", tags=["players"])


@router.get("", response_model=list[PlayerOut])
def list_players(db: Session = Depends(get_db)):
    return db.query(Player).order_by(Player.number).all()


@router.get("/{player_id}", response_model=PlayerStats)
def get_player(player_id: int, db: Session = Depends(get_db)):
    player = db.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    goals = db.query(func.count()).filter(
        GameEvent.player_id == player_id, GameEvent.event_type == EventType.goal
    ).scalar()
    assists = db.query(func.count()).filter(
        GameEvent.player_id == player_id, GameEvent.event_type == EventType.assist
    ).scalar()
    yellow_cards = db.query(func.count()).filter(
        GameEvent.player_id == player_id, GameEvent.event_type == EventType.yellow_card
    ).scalar()
    red_cards = db.query(func.count()).filter(
        GameEvent.player_id == player_id, GameEvent.event_type == EventType.red_card
    ).scalar()
    avg_fitness = db.query(func.avg(Fitness.rating)).filter(
        Fitness.player_id == player_id
    ).scalar()
    potm_count = db.query(func.count()).filter(
        POTM.player_id == player_id
    ).scalar()

    return PlayerStats(
        id=player.id, name=player.name, number=player.number,
        position=player.position, date_of_birth=player.date_of_birth,
        goals=goals, assists=assists, yellow_cards=yellow_cards,
        red_cards=red_cards, avg_fitness=round(avg_fitness, 1) if avg_fitness else None,
        potm_count=potm_count,
    )


@router.post("", response_model=PlayerOut, status_code=201)
def create_player(payload: PlayerCreate, db: Session = Depends(get_db), _=Depends(require_coach)):
    player = Player(**payload.model_dump())
    db.add(player)
    db.commit()
    db.refresh(player)
    return player


@router.put("/{player_id}", response_model=PlayerOut)
def update_player(player_id: int, payload: PlayerCreate, db: Session = Depends(get_db), _=Depends(require_coach)):
    player = db.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    for k, v in payload.model_dump().items():
        setattr(player, k, v)
    db.commit()
    db.refresh(player)
    return player


@router.delete("/{player_id}", status_code=204)
def delete_player(player_id: int, db: Session = Depends(get_db), _=Depends(require_coach)):
    player = db.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    db.delete(player)
    db.commit()
```

- [ ] **Step 3: Create `routes/games.py`**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Game
from schemas import GameCreate, GameOut
from deps import require_coach

router = APIRouter(prefix="/api/games", tags=["games"])


@router.get("", response_model=list[GameOut])
def list_games(db: Session = Depends(get_db)):
    return db.query(Game).order_by(Game.date.desc()).all()


@router.get("/{game_id}", response_model=GameOut)
def get_game(game_id: int, db: Session = Depends(get_db)):
    game = db.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.post("", response_model=GameOut, status_code=201)
def create_game(payload: GameCreate, db: Session = Depends(get_db), _=Depends(require_coach)):
    game = Game(**payload.model_dump())
    db.add(game)
    db.commit()
    db.refresh(game)
    return game


@router.put("/{game_id}", response_model=GameOut)
def update_game(game_id: int, payload: GameCreate, db: Session = Depends(get_db), _=Depends(require_coach)):
    game = db.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    for k, v in payload.model_dump().items():
        setattr(game, k, v)
    db.commit()
    db.refresh(game)
    return game


@router.delete("/{game_id}", status_code=204)
def delete_game(game_id: int, db: Session = Depends(get_db), _=Depends(require_coach)):
    game = db.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    db.delete(game)
    db.commit()
```

- [ ] **Step 4: Create `routes/game_events.py`**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import GameEvent, Game, Player
from schemas import GameEventCreate, GameEventOut
from deps import require_coach

router = APIRouter(prefix="/api/games/{game_id}/events", tags=["game_events"])


@router.get("", response_model=list[GameEventOut])
def list_events(game_id: int, db: Session = Depends(get_db)):
    if not db.get(Game, game_id):
        raise HTTPException(status_code=404, detail="Game not found")
    return db.query(GameEvent).filter(GameEvent.game_id == game_id).all()


@router.post("", response_model=GameEventOut, status_code=201)
def create_event(game_id: int, payload: GameEventCreate, db: Session = Depends(get_db), _=Depends(require_coach)):
    if not db.get(Game, game_id):
        raise HTTPException(status_code=404, detail="Game not found")
    if not db.get(Player, payload.player_id):
        raise HTTPException(status_code=404, detail="Player not found")
    event = GameEvent(game_id=game_id, **payload.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=204)
def delete_event(game_id: int, event_id: int, db: Session = Depends(get_db), _=Depends(require_coach)):
    event = db.query(GameEvent).filter(GameEvent.id == event_id, GameEvent.game_id == game_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
```

- [ ] **Step 5: Create `routes/fitness.py`**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Fitness, Player
from schemas import FitnessCreate, FitnessOut
from deps import require_coach

router = APIRouter(prefix="/api/fitness", tags=["fitness"])


@router.get("", response_model=list[FitnessOut])
def list_fitness(player_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Fitness)
    if player_id:
        q = q.filter(Fitness.player_id == player_id)
    return q.order_by(Fitness.date.desc()).all()


@router.post("", response_model=FitnessOut, status_code=201)
def create_fitness(payload: FitnessCreate, db: Session = Depends(get_db), _=Depends(require_coach)):
    if not db.get(Player, payload.player_id):
        raise HTTPException(status_code=404, detail="Player not found")
    record = Fitness(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{fitness_id}", status_code=204)
def delete_fitness(fitness_id: int, db: Session = Depends(get_db), _=Depends(require_coach)):
    record = db.get(Fitness, fitness_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()
```

- [ ] **Step 6: Create `routes/potm.py`**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import POTM, Game, Player
from schemas import POTMCreate, POTMOut, POTMLeaderboard
from deps import require_coach

router = APIRouter(prefix="/api/potm", tags=["potm"])


@router.get("/leaderboard", response_model=list[POTMLeaderboard])
def leaderboard(db: Session = Depends(get_db)):
    results = (
        db.query(POTM.player_id, Player.name, func.count().label("count"))
        .join(Player, POTM.player_id == Player.id)
        .group_by(POTM.player_id, Player.name)
        .order_by(func.count().desc())
        .all()
    )
    return [POTMLeaderboard(player_id=r[0], player_name=r[1], count=r[2]) for r in results]


@router.post("", response_model=POTMOut, status_code=201)
def create_potm(payload: POTMCreate, db: Session = Depends(get_db), _=Depends(require_coach)):
    if not db.get(Game, payload.game_id):
        raise HTTPException(status_code=404, detail="Game not found")
    if not db.get(Player, payload.player_id):
        raise HTTPException(status_code=404, detail="Player not found")
    existing = db.query(POTM).filter(POTM.game_id == payload.game_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="POTM already set for this game")
    potm = POTM(**payload.model_dump())
    db.add(potm)
    db.commit()
    db.refresh(potm)
    return potm


@router.delete("/{potm_id}", status_code=204)
def delete_potm(potm_id: int, db: Session = Depends(get_db), _=Depends(require_coach)):
    potm = db.get(POTM, potm_id)
    if not potm:
        raise HTTPException(status_code=404, detail="POTM not found")
    db.delete(potm)
    db.commit()
```

- [ ] **Step 7: Create `routes/messages.py`**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Message
from schemas import MessageCreate, MessageOut
from deps import get_current_user, require_coach

router = APIRouter(prefix="/api/messages", tags=["messages"])


@router.get("", response_model=list[MessageOut])
def list_messages(db: Session = Depends(get_db)):
    return db.query(Message).filter(Message.approved == True).order_by(Message.created_at.desc()).all()


@router.get("/all", response_model=list[MessageOut])
def list_all_messages(db: Session = Depends(get_db), _=Depends(require_coach)):
    return db.query(Message).order_by(Message.created_at.desc()).all()


@router.post("", response_model=MessageOut, status_code=201)
def create_message(payload: MessageCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    msg = Message(**payload.model_dump())
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.put("/{message_id}/approve", response_model=MessageOut)
def approve_message(message_id: int, db: Session = Depends(get_db), _=Depends(require_coach)):
    msg = db.get(Message, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.approved = True
    db.commit()
    db.refresh(msg)
    return msg


@router.delete("/{message_id}", status_code=204)
def delete_message(message_id: int, db: Session = Depends(get_db), _=Depends(require_coach)):
    msg = db.get(Message, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    db.delete(msg)
    db.commit()
```

- [ ] **Step 8: Commit**

```bash
git add backend/routes/
git commit -m "feat: add all API route modules (players, games, events, fitness, potm, messages)"
```

---

## Task 5: Backend — Main App & Seed

**Files:**
- Create: `backend/main.py`
- Create: `backend/seed.py`

- [ ] **Step 1: Create `main.py`**

```python
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from auth import router as auth_router
from routes.players import router as players_router
from routes.games import router as games_router
from routes.game_events import router as events_router
from routes.fitness import router as fitness_router
from routes.potm import router as potm_router
from routes.messages import router as messages_router

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TTU14D3 API")

origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(players_router)
app.include_router(games_router)
app.include_router(events_router)
app.include_router(fitness_router)
app.include_router(potm_router)
app.include_router(messages_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 2: Create `seed.py`**

```python
from datetime import date
from passlib.context import CryptContext
from database import SessionLocal, engine, Base
from models import User, Player, Game, GameEvent, EventType, Fitness, POTM, Message, Role

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(User).first():
        print("Database already seeded.")
        db.close()
        return

    # Users
    coach = User(username="coach", password_hash=pwd.hash("coach123"), role=Role.coach)
    parent = User(username="parent", password_hash=pwd.hash("parent123"), role=Role.parent)
    db.add_all([coach, parent])
    db.flush()

    # Players
    players_data = [
        ("Liam Walker", 1, "GK"), ("Noah Chen", 2, "CB"), ("Ethan Patel", 3, "CB"),
        ("Oliver Smith", 4, "RB"), ("James Lee", 5, "LB"), ("Lucas Brown", 6, "CM"),
        ("Mason Davis", 7, "CM"), ("Aiden Wilson", 8, "RM"), ("Jack Taylor", 9, "ST"),
        ("Henry Jones", 10, "CAM"), ("Leo Martinez", 11, "LM"), ("Oscar Nguyen", 12, "CB"),
        ("Charlie Kim", 14, "CM"), ("Archie Thomas", 15, "ST"),
    ]
    players = []
    for name, number, pos in players_data:
        p = Player(name=name, number=number, position=pos, date_of_birth=date(2012, 1, 15))
        players.append(p)
    db.add_all(players)
    db.flush()

    # Games
    games_data = [
        (date(2026, 3, 1), "Westside FC", "Thornleigh Oval", "home", 3, 1),
        (date(2026, 3, 8), "Northern Eagles", "Eagle Park", "away", 2, 2),
        (date(2026, 3, 15), "Eastwood City", "Thornleigh Oval", "home", 4, 0),
        (date(2026, 3, 22), "Riverside United", "River Ground", "away", 1, 3),
    ]
    games = []
    for d, opp, loc, ha, us, them in games_data:
        g = Game(date=d, opponent=opp, location=loc, home_away=ha, our_score=us, their_score=them)
        games.append(g)
    db.add_all(games)
    db.flush()

    # Game Events
    events = [
        GameEvent(game_id=games[0].id, player_id=players[8].id, event_type=EventType.goal, minute=23),
        GameEvent(game_id=games[0].id, player_id=players[9].id, event_type=EventType.assist, minute=23),
        GameEvent(game_id=games[0].id, player_id=players[9].id, event_type=EventType.goal, minute=55),
        GameEvent(game_id=games[0].id, player_id=players[8].id, event_type=EventType.goal, minute=78),
        GameEvent(game_id=games[1].id, player_id=players[8].id, event_type=EventType.goal, minute=30),
        GameEvent(game_id=games[1].id, player_id=players[5].id, event_type=EventType.assist, minute=30),
        GameEvent(game_id=games[1].id, player_id=players[10].id, event_type=EventType.goal, minute=67),
        GameEvent(game_id=games[2].id, player_id=players[8].id, event_type=EventType.goal, minute=12),
        GameEvent(game_id=games[2].id, player_id=players[9].id, event_type=EventType.goal, minute=34),
        GameEvent(game_id=games[2].id, player_id=players[10].id, event_type=EventType.goal, minute=56),
        GameEvent(game_id=games[2].id, player_id=players[13].id, event_type=EventType.goal, minute=80),
        GameEvent(game_id=games[3].id, player_id=players[8].id, event_type=EventType.goal, minute=44),
        GameEvent(game_id=games[3].id, player_id=players[4].id, event_type=EventType.yellow_card, minute=60),
    ]
    db.add_all(events)

    # Fitness
    for i, p in enumerate(players[:8]):
        db.add(Fitness(player_id=p.id, date=date(2026, 3, 20), rating=round(6 + (i % 4) * 0.8, 1)))

    # POTM
    db.add(POTM(game_id=games[0].id, player_id=players[8].id))
    db.add(POTM(game_id=games[1].id, player_id=players[8].id))
    db.add(POTM(game_id=games[2].id, player_id=players[9].id))

    # Messages
    db.add(Message(author="Coach Mike", content="Great win today! Keep up the training.", approved=True))
    db.add(Message(author="Parent Jane", content="What time is Saturday's game?", approved=True))
    db.add(Message(author="Player Leo", content="Can we do extra shooting practice?", approved=False))

    db.commit()
    db.close()
    print("Seeded successfully!")


if __name__ == "__main__":
    seed()
```

- [ ] **Step 3: Test the server starts**

Run: `cd backend && python -c "from main import app; print('App OK')"`
Expected: Prints "App OK"

- [ ] **Step 4: Commit**

```bash
git add backend/main.py backend/seed.py
git commit -m "feat: add FastAPI app entry point and seed script"
```

---

## Task 6: Backend — Tests

**Files:**
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_auth.py`
- Create: `backend/tests/test_players.py`
- Create: `backend/tests/test_games.py`

- [ ] **Step 1: Create `tests/__init__.py`**

Empty file.

- [ ] **Step 2: Create `tests/conftest.py`**

```python
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


@pytest.fixture
def coach_token(client):
    client.post("/api/auth/register", json={"username": "coach", "password": "coach123", "role": "coach"})
    resp = client.post("/api/auth/login", json={"username": "coach", "password": "coach123"})
    return resp.json()["access_token"]


@pytest.fixture
def parent_token(client):
    client.post("/api/auth/register", json={"username": "parent", "password": "parent123", "role": "parent"})
    resp = client.post("/api/auth/login", json={"username": "parent", "password": "parent123"})
    return resp.json()["access_token"]


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}
```

- [ ] **Step 3: Create `tests/test_auth.py`**

```python
from tests.conftest import auth_header


def test_register_and_login(client):
    resp = client.post("/api/auth/register", json={"username": "test", "password": "test123", "role": "parent"})
    assert resp.status_code == 201
    assert resp.json()["username"] == "test"

    resp = client.post("/api/auth/login", json={"username": "test", "password": "test123"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_duplicate_register(client):
    client.post("/api/auth/register", json={"username": "dup", "password": "dup123"})
    resp = client.post("/api/auth/register", json={"username": "dup", "password": "dup456"})
    assert resp.status_code == 400


def test_wrong_password(client):
    client.post("/api/auth/register", json={"username": "user1", "password": "correct"})
    resp = client.post("/api/auth/login", json={"username": "user1", "password": "wrong"})
    assert resp.status_code == 401
```

- [ ] **Step 4: Create `tests/test_players.py`**

```python
from tests.conftest import auth_header


def test_create_player_as_coach(client, coach_token):
    resp = client.post(
        "/api/players",
        json={"name": "Test Player", "number": 7, "position": "CM"},
        headers=auth_header(coach_token),
    )
    assert resp.status_code == 201
    assert resp.json()["name"] == "Test Player"


def test_create_player_as_parent_forbidden(client, parent_token):
    resp = client.post(
        "/api/players",
        json={"name": "Test", "number": 7, "position": "CM"},
        headers=auth_header(parent_token),
    )
    assert resp.status_code == 403


def test_list_players(client, coach_token):
    client.post("/api/players", json={"name": "P1", "number": 1, "position": "GK"}, headers=auth_header(coach_token))
    resp = client.get("/api/players")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


def test_get_player_stats(client, coach_token):
    resp = client.post("/api/players", json={"name": "Stat Player", "number": 9, "position": "ST"}, headers=auth_header(coach_token))
    pid = resp.json()["id"]
    resp = client.get(f"/api/players/{pid}")
    assert resp.status_code == 200
    assert resp.json()["goals"] == 0
```

- [ ] **Step 5: Create `tests/test_games.py`**

```python
from tests.conftest import auth_header


def test_create_game(client, coach_token):
    resp = client.post(
        "/api/games",
        json={"date": "2026-03-29", "opponent": "Test FC", "home_away": "home"},
        headers=auth_header(coach_token),
    )
    assert resp.status_code == 201
    assert resp.json()["opponent"] == "Test FC"


def test_list_games(client, coach_token):
    client.post("/api/games", json={"date": "2026-03-29", "opponent": "FC1", "home_away": "home"}, headers=auth_header(coach_token))
    resp = client.get("/api/games")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


def test_game_events(client, coach_token):
    game = client.post("/api/games", json={"date": "2026-03-29", "opponent": "FC1", "home_away": "home"}, headers=auth_header(coach_token)).json()
    player = client.post("/api/players", json={"name": "P1", "number": 9, "position": "ST"}, headers=auth_header(coach_token)).json()
    resp = client.post(
        f"/api/games/{game['id']}/events",
        json={"player_id": player["id"], "event_type": "goal", "minute": 45},
        headers=auth_header(coach_token),
    )
    assert resp.status_code == 201
    assert resp.json()["event_type"] == "goal"
```

- [ ] **Step 6: Run tests**

Run: `cd backend && pytest tests/ -v`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add backend/tests/
git commit -m "feat: add backend test suite (auth, players, games)"
```

---

## Task 7: Backend — Complete `.env` file

**Files:**
- Modify: `backend/.env`

- [ ] **Step 1: Add missing env vars**

Ensure `backend/.env` has all required variables:
```
DB_HOST=152.67.98.57
DB_USER=fogoroos_user
DB_PASS=zaq12wsx
DB_NAME=ttu14_db
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
FRONTEND_URL=http://localhost:3000
```

- [ ] **Step 2: Commit**

`.env` is in `.gitignore` — no commit needed.

---

## Task 8: Frontend — Project Setup (Vite + React + Tailwind)

**Prerequisite:** Node.js must be installed. Run `brew install node` if not available.

**Files:**
- Create: `frontend/` via `npm create vite@latest`
- Modify: `frontend/vite.config.js`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Modify: `frontend/src/index.css`
- Modify: `frontend/index.html`

- [ ] **Step 1: Scaffold Vite project**

```bash
cd /Users/fabricio/Documents/ttu14d3
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

- [ ] **Step 2: Install dependencies**

```bash
cd frontend
npm install tailwindcss @tailwindcss/vite
npm install react-router-dom @tanstack/react-table recharts react-hook-form @hookform/resolvers zod
```

- [ ] **Step 3: Configure `vite.config.js`**

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
```

- [ ] **Step 4: Replace `src/index.css` with Tailwind**

```css
@import "tailwindcss";

:root {
  --color-thunder-yellow: #FFD700;
  --color-thunder-blue: #0047AB;
}
```

- [ ] **Step 5: Update `index.html` title**

Change `<title>` to `TTU14D3 — Thornleigh Thunder U14 Div 3`

- [ ] **Step 6: Verify dev server starts**

Run: `cd frontend && npm run dev` (verify it opens on port 3000)

- [ ] **Step 7: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold frontend with Vite, React, Tailwind, and dependencies"
```

---

## Task 9: Frontend — Auth Context & API Client

**Files:**
- Create: `frontend/src/api/client.js`
- Create: `frontend/src/context/AuthContext.jsx`

- [ ] **Step 1: Create `api/client.js`**

```js
const BASE = "/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || "Request failed");
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  del: (path) => request(path, { method: "DELETE" }),
};
```

- [ ] **Step 2: Create `context/AuthContext.jsx`**

```jsx
import { createContext, useContext, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [role, setRole] = useState(() => localStorage.getItem("role"));

  const login = async (username, password) => {
    const data = await api.post("/auth/login", { username, password });
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("role", data.role);
    setToken(data.access_token);
    setRole(data.role);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken(null);
    setRole(null);
  };

  const isCoach = role === "coach";

  return (
    <AuthContext.Provider value={{ token, role, isCoach, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api/ frontend/src/context/
git commit -m "feat: add API client and auth context"
```

---

## Task 10: Frontend — Layout, Routing & Login Page

**Files:**
- Create: `frontend/src/components/Layout.jsx`
- Create: `frontend/src/components/ProtectedRoute.jsx`
- Create: `frontend/src/pages/Login.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/main.jsx`

- [ ] **Step 1: Create `components/Layout.jsx`**

```jsx
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { role, isCoach, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#0047AB] text-white px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-[#FFD700]">
          TTU14D3
        </Link>
        <div className="flex gap-4 items-center text-sm">
          <Link to="/" className="hover:text-[#FFD700]">Dashboard</Link>
          <Link to="/players" className="hover:text-[#FFD700]">Players</Link>
          <Link to="/games" className="hover:text-[#FFD700]">Games</Link>
          <Link to="/leaderboard" className="hover:text-[#FFD700]">POTM</Link>
          <Link to="/messages" className="hover:text-[#FFD700]">Messages</Link>
          <span className="text-xs opacity-70 capitalize">{role}</span>
          <button onClick={handleLogout} className="bg-[#FFD700] text-[#0047AB] px-3 py-1 rounded font-semibold text-xs">
            Logout
          </button>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/ProtectedRoute.jsx`**

```jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
```

- [ ] **Step 3: Create `pages/Login.jsx`**

```jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0047AB]">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[#0047AB] mb-1 text-center">TTU14D3</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Thornleigh Thunder U14 Div 3</p>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <input
          type="text" placeholder="Username" value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#0047AB]"
        />
        <input
          type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#0047AB]"
        />
        <button type="submit" className="w-full bg-[#FFD700] text-[#0047AB] font-bold py-2 rounded hover:bg-yellow-400">
          Sign In
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Replace `App.jsx`**

```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Players from "./pages/Players";
import PlayerDetail from "./pages/PlayerDetail";
import Games from "./pages/Games";
import GameDetail from "./pages/GameDetail";
import Leaderboard from "./pages/Leaderboard";
import Messages from "./pages/Messages";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/players" element={<Players />} />
            <Route path="/players/:id" element={<PlayerDetail />} />
            <Route path="/games" element={<Games />} />
            <Route path="/games/:id" element={<GameDetail />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/messages" element={<Messages />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

- [ ] **Step 5: Replace `main.jsx`**

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/
git commit -m "feat: add layout, routing, login page, and protected routes"
```

---

## Task 11: Frontend — Dashboard & Data Table Component

**Files:**
- Create: `frontend/src/components/DataTable.jsx`
- Create: `frontend/src/pages/Dashboard.jsx`

- [ ] **Step 1: Create `components/DataTable.jsx`**

```jsx
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { useState } from "react";

export default function DataTable({ data, columns }) {
  const [sorting, setSorting] = useState([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded border border-gray-200">
      <table className="w-full text-sm text-left">
        <thead className="bg-[#0047AB] text-white">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  className="px-4 py-2 cursor-pointer select-none"
                  onClick={h.column.getToggleSortingHandler()}
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                  {{ asc: " ▲", desc: " ▼" }[h.column.getIsSorted()] ?? ""}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-t hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Create `pages/Dashboard.jsx`**

```jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function Dashboard() {
  const [players, setPlayers] = useState([]);
  const [games, setGames] = useState([]);

  useEffect(() => {
    api.get("/players").then(setPlayers);
    api.get("/games").then(setGames);
  }, []);

  const recent = games.slice(0, 3);
  const wins = games.filter((g) => g.our_score > g.their_score).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0047AB] mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-[#FFD700]">
          <p className="text-sm text-gray-500">Players</p>
          <p className="text-3xl font-bold text-[#0047AB]">{players.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-[#0047AB]">
          <p className="text-sm text-gray-500">Games Played</p>
          <p className="text-3xl font-bold text-[#0047AB]">{games.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Wins</p>
          <p className="text-3xl font-bold text-green-600">{wins}</p>
        </div>
      </div>
      <h2 className="text-lg font-semibold mb-3">Recent Games</h2>
      <div className="space-y-2">
        {recent.map((g) => (
          <Link key={g.id} to={`/games/${g.id}`} className="block bg-white rounded shadow p-3 hover:bg-gray-50">
            <div className="flex justify-between">
              <span className="font-medium">{g.opponent}</span>
              <span className="font-bold">
                {g.our_score ?? "-"} – {g.their_score ?? "-"}
              </span>
            </div>
            <span className="text-xs text-gray-400">{g.date} · {g.home_away}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/DataTable.jsx frontend/src/pages/Dashboard.jsx
git commit -m "feat: add Dashboard page and reusable DataTable component"
```

---

## Task 12: Frontend — Players Pages

**Files:**
- Create: `frontend/src/pages/Players.jsx`
- Create: `frontend/src/pages/PlayerDetail.jsx`

- [ ] **Step 1: Create `pages/Players.jsx`**

```jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import DataTable from "../components/DataTable";

export default function Players() {
  const [players, setPlayers] = useState([]);
  const { isCoach } = useAuth();
  const [form, setForm] = useState({ name: "", number: "", position: "" });

  useEffect(() => {
    api.get("/players").then(setPlayers);
  }, []);

  const columns = [
    { accessorKey: "number", header: "#", size: 60 },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <Link to={`/players/${row.original.id}`} className="text-[#0047AB] hover:underline font-medium">
          {row.original.name}
        </Link>
      ),
    },
    { accessorKey: "position", header: "Position" },
  ];

  const handleAdd = async (e) => {
    e.preventDefault();
    const player = await api.post("/players", { ...form, number: parseInt(form.number) });
    setPlayers([...players, player]);
    setForm({ name: "", number: "", position: "" });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0047AB] mb-4">Players</h1>
      {isCoach && (
        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded px-3 py-1 text-sm" required />
          <input placeholder="#" type="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })}
            className="border rounded px-3 py-1 text-sm w-16" required />
          <input placeholder="Position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}
            className="border rounded px-3 py-1 text-sm" required />
          <button type="submit" className="bg-[#FFD700] text-[#0047AB] font-bold px-4 py-1 rounded text-sm">Add</button>
        </form>
      )}
      <DataTable data={players} columns={columns} />
    </div>
  );
}
```

- [ ] **Step 2: Create `pages/PlayerDetail.jsx`**

```jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";

export default function PlayerDetail() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [fitness, setFitness] = useState([]);

  useEffect(() => {
    api.get(`/players/${id}`).then(setPlayer);
    api.get(`/fitness?player_id=${id}`).then(setFitness);
  }, [id]);

  if (!player) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0047AB] mb-1">
        #{player.number} {player.name}
      </h1>
      <p className="text-gray-500 mb-6">{player.position}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          ["Goals", player.goals],
          ["Assists", player.assists],
          ["Yellow Cards", player.yellow_cards],
          ["Red Cards", player.red_cards],
        ].map(([label, val]) => (
          <div key={label} className="bg-white rounded shadow p-4 text-center">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-[#0047AB]">{val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded shadow p-4 text-center">
          <p className="text-sm text-gray-500">Avg Fitness</p>
          <p className="text-2xl font-bold text-[#0047AB]">{player.avg_fitness ?? "—"}</p>
        </div>
        <div className="bg-white rounded shadow p-4 text-center">
          <p className="text-sm text-gray-500">POTM Awards</p>
          <p className="text-2xl font-bold text-[#FFD700]">{player.potm_count}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">Fitness History</h2>
      {fitness.length === 0 ? (
        <p className="text-gray-400">No fitness records yet.</p>
      ) : (
        <div className="space-y-2">
          {fitness.map((f) => (
            <div key={f.id} className="bg-white rounded shadow p-3 flex justify-between">
              <span>{f.date}</span>
              <span className="font-bold">{f.rating}/10</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Players.jsx frontend/src/pages/PlayerDetail.jsx
git commit -m "feat: add Players list and PlayerDetail pages"
```

---

## Task 13: Frontend — Games Pages

**Files:**
- Create: `frontend/src/pages/Games.jsx`
- Create: `frontend/src/pages/GameDetail.jsx`

- [ ] **Step 1: Create `pages/Games.jsx`**

```jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import DataTable from "../components/DataTable";

export default function Games() {
  const [games, setGames] = useState([]);
  const { isCoach } = useAuth();
  const [form, setForm] = useState({ date: "", opponent: "", location: "", home_away: "home" });

  useEffect(() => {
    api.get("/games").then(setGames);
  }, []);

  const columns = [
    { accessorKey: "date", header: "Date" },
    {
      accessorKey: "opponent",
      header: "Opponent",
      cell: ({ row }) => (
        <Link to={`/games/${row.original.id}`} className="text-[#0047AB] hover:underline font-medium">
          {row.original.opponent}
        </Link>
      ),
    },
    { accessorKey: "home_away", header: "H/A", cell: ({ getValue }) => getValue().toUpperCase() },
    {
      header: "Score",
      cell: ({ row }) => {
        const g = row.original;
        return g.our_score != null ? `${g.our_score} – ${g.their_score}` : "—";
      },
    },
  ];

  const handleAdd = async (e) => {
    e.preventDefault();
    const game = await api.post("/games", form);
    setGames([game, ...games]);
    setForm({ date: "", opponent: "", location: "", home_away: "home" });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0047AB] mb-4">Games</h1>
      {isCoach && (
        <form onSubmit={handleAdd} className="flex gap-2 mb-4 flex-wrap">
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="border rounded px-3 py-1 text-sm" required />
          <input placeholder="Opponent" value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })}
            className="border rounded px-3 py-1 text-sm" required />
          <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="border rounded px-3 py-1 text-sm" />
          <select value={form.home_away} onChange={(e) => setForm({ ...form, home_away: e.target.value })}
            className="border rounded px-3 py-1 text-sm">
            <option value="home">Home</option>
            <option value="away">Away</option>
          </select>
          <button type="submit" className="bg-[#FFD700] text-[#0047AB] font-bold px-4 py-1 rounded text-sm">Add</button>
        </form>
      )}
      <DataTable data={games} columns={columns} />
    </div>
  );
}
```

- [ ] **Step 2: Create `pages/GameDetail.jsx`**

```jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function GameDetail() {
  const { id } = useParams();
  const { isCoach } = useAuth();
  const [game, setGame] = useState(null);
  const [events, setEvents] = useState([]);
  const [players, setPlayers] = useState([]);
  const [form, setForm] = useState({ player_id: "", event_type: "goal", minute: "" });

  useEffect(() => {
    api.get(`/games/${id}`).then(setGame);
    api.get(`/games/${id}/events`).then(setEvents);
    api.get("/players").then(setPlayers);
  }, [id]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const ev = await api.post(`/games/${id}/events`, {
      player_id: parseInt(form.player_id),
      event_type: form.event_type,
      minute: form.minute ? parseInt(form.minute) : null,
    });
    setEvents([...events, ev]);
    setForm({ player_id: "", event_type: "goal", minute: "" });
  };

  if (!game) return <p>Loading...</p>;

  const playerName = (pid) => players.find((p) => p.id === pid)?.name ?? `#${pid}`;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0047AB] mb-1">
        vs {game.opponent}
      </h1>
      <p className="text-gray-500 mb-2">{game.date} · {game.location} · {game.home_away.toUpperCase()}</p>
      <p className="text-3xl font-bold mb-6">
        {game.our_score ?? "—"} – {game.their_score ?? "—"}
      </p>

      <h2 className="text-lg font-semibold mb-3">Match Events</h2>
      {events.length === 0 ? (
        <p className="text-gray-400 mb-4">No events recorded.</p>
      ) : (
        <div className="space-y-2 mb-4">
          {events.map((ev) => (
            <div key={ev.id} className="bg-white rounded shadow p-3 flex justify-between items-center">
              <span>
                <span className="font-medium">{playerName(ev.player_id)}</span>
                <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100">{ev.event_type.replace("_", " ")}</span>
              </span>
              {ev.minute && <span className="text-sm text-gray-400">{ev.minute}'</span>}
            </div>
          ))}
        </div>
      )}

      {isCoach && (
        <form onSubmit={handleAdd} className="flex gap-2 flex-wrap">
          <select value={form.player_id} onChange={(e) => setForm({ ...form, player_id: e.target.value })}
            className="border rounded px-3 py-1 text-sm" required>
            <option value="">Player...</option>
            {players.map((p) => <option key={p.id} value={p.id}>#{p.number} {p.name}</option>)}
          </select>
          <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}
            className="border rounded px-3 py-1 text-sm">
            <option value="goal">Goal</option>
            <option value="assist">Assist</option>
            <option value="yellow_card">Yellow Card</option>
            <option value="red_card">Red Card</option>
          </select>
          <input type="number" placeholder="Min" value={form.minute}
            onChange={(e) => setForm({ ...form, minute: e.target.value })}
            className="border rounded px-3 py-1 text-sm w-16" />
          <button type="submit" className="bg-[#FFD700] text-[#0047AB] font-bold px-4 py-1 rounded text-sm">Add</button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Games.jsx frontend/src/pages/GameDetail.jsx
git commit -m "feat: add Games list and GameDetail pages with event logging"
```

---

## Task 14: Frontend — POTM Leaderboard (Recharts)

**Files:**
- Create: `frontend/src/pages/Leaderboard.jsx`

- [ ] **Step 1: Create `pages/Leaderboard.jsx`**

```jsx
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { api } from "../api/client";

export default function Leaderboard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get("/potm/leaderboard").then(setData);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0047AB] mb-6">Player of the Match</h1>
      {data.length === 0 ? (
        <p className="text-gray-400">No POTM awards yet.</p>
      ) : (
        <div className="bg-white rounded shadow p-6">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="player_name" width={100} />
              <Tooltip />
              <Bar dataKey="count" name="Awards" radius={[0, 6, 6, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "#FFD700" : "#0047AB"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/Leaderboard.jsx
git commit -m "feat: add POTM leaderboard page with Recharts bar chart"
```

---

## Task 15: Frontend — Messages Page (with Coach Moderation)

**Files:**
- Create: `frontend/src/pages/Messages.jsx`

- [ ] **Step 1: Create `pages/Messages.jsx`**

```jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function Messages() {
  const { isCoach } = useAuth();
  const [messages, setMessages] = useState([]);
  const [form, setForm] = useState({ author: "", content: "" });

  useEffect(() => {
    const endpoint = isCoach ? "/messages/all" : "/messages";
    api.get(endpoint).then(setMessages);
  }, [isCoach]);

  const handlePost = async (e) => {
    e.preventDefault();
    const msg = await api.post("/messages", form);
    setMessages([msg, ...messages]);
    setForm({ author: "", content: "" });
  };

  const handleApprove = async (id) => {
    const updated = await api.put(`/messages/${id}/approve`);
    setMessages(messages.map((m) => (m.id === id ? updated : m)));
  };

  const handleDelete = async (id) => {
    await api.del(`/messages/${id}`);
    setMessages(messages.filter((m) => m.id !== id));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0047AB] mb-4">Messages</h1>

      <form onSubmit={handlePost} className="mb-6 space-y-2">
        <input placeholder="Your name" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })}
          className="border rounded px-3 py-2 w-full text-sm" required />
        <textarea placeholder="Write a message..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="border rounded px-3 py-2 w-full text-sm" rows={3} required />
        <button type="submit" className="bg-[#FFD700] text-[#0047AB] font-bold px-4 py-2 rounded text-sm">Post</button>
      </form>

      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`bg-white rounded shadow p-4 ${!m.approved ? "border-l-4 border-yellow-400" : ""}`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="font-semibold">{m.author}</span>
                <span className="text-xs text-gray-400 ml-2">{new Date(m.created_at).toLocaleDateString()}</span>
                {!m.approved && <span className="text-xs text-yellow-600 ml-2 font-medium">Pending</span>}
              </div>
              {isCoach && (
                <div className="flex gap-2">
                  {!m.approved && (
                    <button onClick={() => handleApprove(m.id)} className="text-xs text-green-600 hover:underline">
                      Approve
                    </button>
                  )}
                  <button onClick={() => handleDelete(m.id)} className="text-xs text-red-600 hover:underline">
                    Delete
                  </button>
                </div>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-700">{m.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/Messages.jsx
git commit -m "feat: add Messages page with coach moderation (approve/delete)"
```

---

## Task 16: Final — Clean up scaffolded files & verify full stack

- [ ] **Step 1: Remove default Vite boilerplate files**

Delete `frontend/src/App.css` and `frontend/src/assets/` if they still exist from scaffolding.

- [ ] **Step 2: Verify backend starts**

```bash
cd backend && python -c "from main import app; print('Backend OK')"
```

- [ ] **Step 3: Verify frontend builds**

```bash
cd frontend && npm run build
```

- [ ] **Step 4: Run backend tests**

```bash
cd backend && pytest tests/ -v
```

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: clean up scaffolding, verify full stack"
```
