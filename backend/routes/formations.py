from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Formation
from schemas import FormationCreate, FormationUpdate, FormationOut
from deps import require_coach

router = APIRouter(prefix="/api/formations", tags=["formations"])


@router.get("", response_model=list[FormationOut])
def list_formations(db: Session = Depends(get_db)):
    return db.query(Formation).all()


@router.get("/{formation_id}", response_model=FormationOut)
def get_formation(formation_id: int, db: Session = Depends(get_db)):
    formation = db.get(Formation, formation_id)
    if not formation:
        raise HTTPException(status_code=404, detail="Formation not found")
    return formation


@router.post("", response_model=FormationOut, status_code=201)
def create_formation(payload: FormationCreate, db: Session = Depends(get_db), _=Depends(require_coach)):
    formation = Formation(**payload.model_dump())
    db.add(formation)
    db.commit()
    db.refresh(formation)
    return formation


@router.put("/{formation_id}", response_model=FormationOut)
def update_formation(formation_id: int, payload: FormationUpdate, db: Session = Depends(get_db), _=Depends(require_coach)):
    formation = db.get(Formation, formation_id)
    if not formation:
        raise HTTPException(status_code=404, detail="Formation not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(formation, field, value)
    db.commit()
    db.refresh(formation)
    return formation


@router.delete("/{formation_id}", status_code=204)
def delete_formation(formation_id: int, db: Session = Depends(get_db), _=Depends(require_coach)):
    formation = db.get(Formation, formation_id)
    if not formation:
        raise HTTPException(status_code=404, detail="Formation not found")
    db.delete(formation)
    db.commit()
