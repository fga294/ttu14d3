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


class FitnessUpdate(BaseModel):
    date: date | None = None
    rating: float | None = Field(default=None, ge=1, le=10)
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
