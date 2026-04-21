import pytest
from unittest.mock import MagicMock, patch
from app.services.query_planning.planner import Nl2SqlPlanner, PlannerResult

@pytest.fixture
def planner():
    with patch('app.services.query_planning.planner.OpenAI'):
        return Nl2SqlPlanner()

def test_extract_sql(planner):
    # Test extraction with markdown blocks
    raw = "Here is the SQL:\n```sql\nSELECT * FROM users\n```"
    assert planner._extract_sql(raw) == "SELECT * FROM users"
    
    # Test extraction with no blocks
    assert planner._extract_sql("SELECT 1") == "SELECT 1"

def test_plan_guardrails(planner):
    # Mock LLM to return a DML statement
    planner.client.chat.completions.create.return_value.choices[0].message.content = "```sql\nDROP TABLE users\n```"
    
    result = planner.plan("delete everything")
    
    # Should flag as validation error
    assert "Only SELECT statements are permitted" in str(result.validation_warnings)
    assert result.confidence == 0.0

def test_plan_valid_sql(planner):
    # Mock LLM to return valid SELECT
    planner.client.chat.completions.create.return_value.choices[0].message.content = "```sql\nSELECT count(*) FROM events\n```"
    
    result = planner.plan("how many events")
    
    assert result.candidate_sql == "SELECT count(*) FROM events"
    assert result.confidence == 0.95
    assert len(result.validation_warnings) > 0 # Should have limit warning
