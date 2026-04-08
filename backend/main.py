import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from auth import router as auth_router
from routes.players import router as players_router
from routes.games import router as games_router
from routes.game_events import router as events_router
from routes.fitness import router as fitness_router
from routes.formations import router as formations_router

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TTU14D3 API")

origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(players_router)
app.include_router(games_router)
app.include_router(events_router)
app.include_router(fitness_router)
app.include_router(formations_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
