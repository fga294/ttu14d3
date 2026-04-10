from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import GameEvent, Game, Player, EventType
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
    if payload.event_type == EventType.opponent_goal:
        if payload.player_id is not None:
            raise HTTPException(status_code=400, detail="Opponent goals must not have a player_id")
    else:
        if payload.player_id is None:
            raise HTTPException(status_code=400, detail="player_id is required for this event type")
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
