from datetime import date as _date
from typing import Optional
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
    secondary_position: str | None = Field(default=None, max_length=30)
    tertiary_position: str | None = Field(default=None, max_length=30)
    date_of_birth: _date | None = None


class PlayerOut(BaseModel):
    id: int
    name: str
    number: int
    position: str
    secondary_position: str | None
    tertiary_position: str | None
    date_of_birth: _date | None
    model_config = {"from_attributes": True}


class PlayerStats(PlayerOut):
    goals: int = 0
    assists: int = 0
    yellow_cards: int = 0
    red_cards: int = 0
    avg_fitness: float | None = None


# --- Game ---
class GameCreate(BaseModel):
    date: _date
    opponent: str = Field(max_length=100)
    location: str | None = None
    home_away: str = Field(default="home", pattern="^(home|away)$")
    our_score: int | None = None
    their_score: int | None = None


class GameOut(BaseModel):
    id: int
    date: _date
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
    date: _date
    rating: float = Field(ge=1, le=10)
    notes: str | None = None


class FitnessUpdate(BaseModel):
    date: Optional[_date] = None
    rating: Optional[float] = Field(default=None, ge=1, le=10)
    notes: Optional[str] = None


class FitnessOut(BaseModel):
    id: int
    player_id: int
    date: _date
    rating: float
    notes: str | None
    model_config = {"from_attributes": True}


# --- Formation ---
class FormationCreate(BaseModel):
    name: str = Field(max_length=100)
    formation_type: str = Field(max_length=10)
    starters: list[int]
    reserves: list[int] = []


class FormationUpdate(BaseModel):
    name: str | None = None
    formation_type: str | None = None
    starters: list[int] | None = None
    reserves: list[int] | None = None


class FormationOut(BaseModel):
    id: int
    name: str
    formation_type: str
    starters: list[int]
    reserves: list[int]
    model_config = {"from_attributes": True}
