from tests.conftest import auth_header


def test_create_player_as_coach(client, coach_token):
    resp = client.post(
        "/api/players",
        json={"name": "Test Player", "number": 7, "position": "CM"},
        headers=auth_header(coach_token),
    )
    assert resp.status_code == 201
    assert resp.json()["name"] == "Test Player"


def test_create_player_as_parent_forbidden(client, parent_token):
    resp = client.post(
        "/api/players",
        json={"name": "Test", "number": 7, "position": "CM"},
        headers=auth_header(parent_token),
    )
    assert resp.status_code == 403


def test_list_players(client, coach_token):
    client.post("/api/players", json={"name": "P1", "number": 1, "position": "GK"}, headers=auth_header(coach_token))
    resp = client.get("/api/players")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


def test_get_player_stats(client, coach_token):
    resp = client.post("/api/players", json={"name": "Stat Player", "number": 9, "position": "ST"}, headers=auth_header(coach_token))
    pid = resp.json()["id"]
    resp = client.get(f"/api/players/{pid}")
    assert resp.status_code == 200
    assert resp.json()["goals"] == 0


def test_list_player_stats_aggregates_goals_and_assists(client, coach_token):
    scorer = client.post("/api/players", json={"name": "Scorer", "number": 10, "position": "ST"}, headers=auth_header(coach_token)).json()
    assister = client.post("/api/players", json={"name": "Assister", "number": 8, "position": "CM"}, headers=auth_header(coach_token)).json()
    unused = client.post("/api/players", json={"name": "Bench", "number": 22, "position": "CB"}, headers=auth_header(coach_token)).json()

    game = client.post("/api/games", json={"date": "2026-04-01", "opponent": "X", "home_away": "home"}, headers=auth_header(coach_token)).json()
    for _ in range(2):
        client.post(f"/api/games/{game['id']}/events", json={"player_id": scorer["id"], "event_type": "goal"}, headers=auth_header(coach_token))
    client.post(f"/api/games/{game['id']}/events", json={"player_id": assister["id"], "event_type": "assist"}, headers=auth_header(coach_token))
    client.post(f"/api/games/{game['id']}/events", json={"event_type": "opponent_goal"}, headers=auth_header(coach_token))

    resp = client.get("/api/players/stats")
    assert resp.status_code == 200
    by_id = {p["id"]: p for p in resp.json()}
    assert by_id[scorer["id"]]["goals"] == 2
    assert by_id[scorer["id"]]["assists"] == 0
    assert by_id[assister["id"]]["goals"] == 0
    assert by_id[assister["id"]]["assists"] == 1
    assert by_id[unused["id"]]["goals"] == 0
    assert by_id[unused["id"]]["assists"] == 0
