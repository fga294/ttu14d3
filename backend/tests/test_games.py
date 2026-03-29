from tests.conftest import auth_header


def test_create_game(client, coach_token):
    resp = client.post(
        "/api/games",
        json={"date": "2026-03-29", "opponent": "Test FC", "home_away": "home"},
        headers=auth_header(coach_token),
    )
    assert resp.status_code == 201
    assert resp.json()["opponent"] == "Test FC"


def test_list_games(client, coach_token):
    client.post("/api/games", json={"date": "2026-03-29", "opponent": "FC1", "home_away": "home"}, headers=auth_header(coach_token))
    resp = client.get("/api/games")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


def test_game_events(client, coach_token):
    game = client.post("/api/games", json={"date": "2026-03-29", "opponent": "FC1", "home_away": "home"}, headers=auth_header(coach_token)).json()
    player = client.post("/api/players", json={"name": "P1", "number": 9, "position": "ST"}, headers=auth_header(coach_token)).json()
    resp = client.post(
        f"/api/games/{game['id']}/events",
        json={"player_id": player["id"], "event_type": "goal", "minute": 45},
        headers=auth_header(coach_token),
    )
    assert resp.status_code == 201
    assert resp.json()["event_type"] == "goal"
