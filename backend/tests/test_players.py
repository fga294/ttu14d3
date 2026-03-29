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
