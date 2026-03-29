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
