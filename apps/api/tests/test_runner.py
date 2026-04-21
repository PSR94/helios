import pytest
import duckdb
import os
from app.services.query_execution.runner import QueryRunner

@pytest.fixture
def temp_db(tmp_path):
    db_path = tmp_path / "test.duckdb"
    with duckdb.connect(str(db_path)) as conn:
        conn.execute("CREATE TABLE test_table (id INTEGER, name VARCHAR)")
        conn.execute("INSERT INTO test_table VALUES (1, 'Alice'), (2, 'Bob')")
    return str(db_path)

def test_runner_execution(temp_db):
    runner = QueryRunner(db_path=temp_db)
    result = runner.execute("SELECT * FROM test_table")
    
    assert result["columns"] == ["id", "name"]
    assert len(result["rows"]) == 2
    assert result["rows"][0] == [1, "Alice"]
    assert result["execution_time_ms"] > 0

def test_runner_read_only(temp_db):
    runner = QueryRunner(db_path=temp_db)
    
    # Attempting to write in read_only mode should fail
    with pytest.raises(ValueError) as exc:
        runner.execute("DROP TABLE test_table")
    assert "Execution Error" in str(exc.value)
