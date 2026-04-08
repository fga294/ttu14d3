from tests.conftest import auth_header


def _create_player(client, coach_token):
    resp = client.post(
        "/api/players",
        json={"name": "Fit Player", "number": 5, "position": "CM"},
        headers=auth_header(coach_token),
    )
    return resp.json()["id"]


def _create_record(client, coach_token, player_id):
    resp = client.post(
        "/api/fitness",
        json={"player_id": player_id, "date": "2026-03-01", "rating": 7.0},
        headers=auth_header(coach_token),
    )
    return resp.json()["id"]


def test_update_fitness_as_coach(client, coach_token):
    pid = _create_player(client, coach_token)
    fid = _create_record(client, coach_token, pid)
    resp = client.put(
        f"/api/fitness/{fid}",
        json={"rating": 9.0, "notes": "Great session"},
        headers=auth_header(coach_token),
    )
    assert resp.status_code == 200
    assert resp.json()["rating"] == 9.0
    assert resp.json()["notes"] == "Great session"
    assert resp.json()["date"] == "2026-03-01"  # unchanged


def test_update_fitness_as_parent_forbidden(client, coach_token, parent_token):
    pid = _create_player(client, coach_token)
    fid = _create_record(client, coach_token, pid)
    resp = client.put(
        f"/api/fitness/{fid}",
        json={"rating": 5.0},
        headers=auth_header(parent_token),
    )
    assert resp.status_code == 403


def test_update_fitness_not_found(client, coach_token):
    resp = client.put(
        "/api/fitness/9999",
        json={"rating": 5.0},
        headers=auth_header(coach_token),
    )
    assert resp.status_code == 404


def test_create_and_list_fitness(client, coach_token):
    pid = _create_player(client, coach_token)
    client.post(
        "/api/fitness",
        json={"player_id": pid, "date": "2026-03-10", "rating": 6.5},
        headers=auth_header(coach_token),
    )
    resp = client.get(f"/api/fitness?player_id={pid}")
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["rating"] == 6.5


def test_delete_fitness_as_coach(client, coach_token):
    pid = _create_player(client, coach_token)
    fid = _create_record(client, coach_token, pid)
    resp = client.delete(f"/api/fitness/{fid}", headers=auth_header(coach_token))
    assert resp.status_code == 204
    resp = client.get(f"/api/fitness?player_id={pid}")
    assert resp.json() == []
