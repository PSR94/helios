import yaml
from pathlib import Path

from app.core.config import settings

METRICS_YAML_PATH = settings.project_root / "datasets" / "semantic" / "metrics.yaml"

class SemanticParser:
    """
    Loads and parses the dbt-inspired metrics.yaml semantic layer.
    Exposes it as a structured string context for the LLM.
    """
    
    def __init__(self, file_path: str = METRICS_YAML_PATH):
        self.file_path = file_path
        self._cache = None
        
    def _load(self):
        if self._cache is None:
            path = Path(self.file_path)
            if not path.exists():
                raise FileNotFoundError(f"Semantic file not found at {self.file_path}")
            with path.open("r", encoding="utf-8") as f:
                self._cache = yaml.safe_load(f)
        return self._cache
        
    def get_prompt_context(self) -> str:
        """
        Formats the semantic layer into a clear string for the LLM prompt.
        """
        data = self._load()
        
        context_parts = []
        context_parts.append("### SEMANTIC LAYER (USE THIS TO BUILD SQL) ###")
        
        context_parts.append("\n# TABLES AND SCHEMA #")
        for dataset in data.get("datasets", []):
            context_parts.append(f"Table: `{dataset['table']}` - {dataset.get('description', '')}")
            cols = [f"  - {c['name']} ({c['type']}): {c.get('description', '')}" for c in dataset.get("columns", [])]
            context_parts.append("\n".join(cols))
            
            if "joins" in dataset:
                joins = [f"  -> Joins to `{j['to']}` on `{j['sql_on']}`" for j in dataset["joins"]]
                context_parts.append("  Joins:\n" + "\n".join(joins))
            context_parts.append("")
            
        context_parts.append("\n# GOVERNED METRICS #")
        for metric in data.get("metrics", []):
            context_parts.append(f"Metric: `{metric['name']}` - {metric.get('description', '')}")
            context_parts.append(f"  Calculation SQL: {metric.get('sql', '')}")
            if "filters" in metric:
                filters = [f"    AND {f}" for f in metric["filters"]]
                context_parts.append("  Required Filters:\n" + "\n".join(filters))
            context_parts.append("")
            
        return "\n".join(context_parts)

# Singleton instance
semantic_parser = SemanticParser()
