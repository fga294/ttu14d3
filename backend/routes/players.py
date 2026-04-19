from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import case, func

from database import get_db
from models import Player, GameEvent, EventType, Fitness
from schemas import PlayerCreate, PlayerGoalsAssists, PlayerOut, PlayerStats
from deps import get_current_user, require_coach

router = APIRouter(prefix="/api/players", tags=["players"])


@router.get("", response_model=list[PlayerOut])
def list_players(db: Session = Depends(get_db)):
    return db.query(Player).order_by(Player.number).all()


@router.get("/stats", response_model=list[PlayerGoalsAssists])
def list_player_stats(db: Session = Depends(get_db)):
    goals_col = func.sum(case((GameEvent.event_type == EventType.goal, 1), else_=0)).label("goals")
    assists_col = func.sum(case((GameEvent.event_type == EventType.assist, 1), else_=0)).label("assists")
    rows = (
        db.query(Player, goals_col, assists_col)
        .outerjoin(GameEvent, GameEvent.player_id == Player.id)
        .group_by(Player.id)
        .order_by(Player.number)
        .all()
    )
    return [
        PlayerGoalsAssists(
            id=p.id, name=p.name, number=p.number,
            position=p.position, secondary_position=p.secondary_position,
            date_of_birth=p.date_of_birth,
            goals=int(goals or 0), assists=int(assists or 0),
        )
        for p, goals, assists in rows
    ]


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

    return PlayerStats(
        id=player.id, name=player.name, number=player.number,
        position=player.position,
        secondary_position=player.secondary_position,
        date_of_birth=player.date_of_birth,
        goals=goals, assists=assists, yellow_cards=yellow_cards,
        red_cards=red_cards, avg_fitness=round(avg_fitness, 1) if avg_fitness else None,
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
