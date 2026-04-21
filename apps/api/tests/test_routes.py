import json

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_route():
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] in {"ok", "degraded"}
    assert body["environment"] == "development"
    assert "dependencies" in body
    assert "X-Request-ID" in response.headers


def test_plan_run_and_explain_flow():
    plan_response = client.post("/api/v1/query/plan", json={"query": "show daily active users"})
    assert plan_response.status_code == 200
    plan = plan_response.json()
    assert plan["candidate_sql"]

    run_response = client.post("/api/v1/query/run", json={"sql": plan["candidate_sql"]})
    assert run_response.status_code == 200
    run_payload = run_response.json()
    assert run_payload["columns"]
    assert run_payload["rows"]

    explain_response = client.post(
        "/api/v1/query/explain",
        json={
            "query": "show daily active users",
            "sql": plan["candidate_sql"],
            "columns": run_payload["columns"],
            "rows": run_payload["rows"][:5],
        },
    )
    assert explain_response.status_code == 200
    assert explain_response.json()["insight"]


def test_workspace_save_and_list():
    payload = {
        "user_query": "show daily active users",
        "generated_sql": "SELECT 1",
        "insight_narrative": "Demo narrative",
        "results_json": json.dumps({"columns": ["value"], "rows": [[1]]}),
    }

    create_response = client.post("/api/v1/workspaces/", json=payload)
    assert create_response.status_code == 201
    created = create_response.json()

    list_response = client.get("/api/v1/workspaces/")
    assert list_response.status_code == 200
    assert any(item["id"] == created["id"] for item in list_response.json())
