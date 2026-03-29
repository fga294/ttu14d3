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
