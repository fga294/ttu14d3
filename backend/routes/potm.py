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
