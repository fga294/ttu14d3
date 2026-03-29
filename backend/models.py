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
