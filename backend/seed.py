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

    # Fitness — 4 entries per player across 4 dates
    fitness_data = [
        (date(2026, 3, 1),  [6.2, 5.8, 7.0, 6.5, 5.5, 7.2, 6.8, 7.5, 8.0, 7.0, 6.5, 6.0, 7.3, 6.8]),
        (date(2026, 3, 10), [6.8, 6.2, 7.4, 7.0, 6.0, 7.8, 7.2, 8.0, 8.5, 7.5, 7.0, 6.5, 7.8, 7.2]),
        (date(2026, 3, 20), [7.2, 6.6, 7.8, 7.4, 6.4, 8.1, 7.5, 8.3, 8.8, 7.9, 7.3, 6.9, 8.1, 7.5]),
        (date(2026, 3, 28), [7.5, 7.0, 8.1, 7.8, 6.8, 8.4, 7.9, 8.6, 9.2, 8.2, 7.7, 7.2, 8.5, 7.9]),
    ]
    for entry_date, ratings in fitness_data:
        for player, rating in zip(players, ratings):
            db.add(Fitness(player_id=player.id, date=entry_date, rating=rating))

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
