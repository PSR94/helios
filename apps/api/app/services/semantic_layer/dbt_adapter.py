import json
import os
from typing import Dict, List

class DbtAdapter:
    """
    Parses a dbt manifest.json to automatically generate HELIOS semantic definitions.
    """
    def __init__(self, manifest_path: str):
        self.manifest_path = manifest_path

    def load_metadata(self) -> Dict:
        if not os.path.exists(self.manifest_path):
            return {"error": "Manifest file not found"}

        with open(self.manifest_path, "r") as f:
            manifest = json.load(f)

        metrics = []
        # In dbt, metrics are stored in the 'metrics' node
        # In newer dbt versions, they might be in 'semantic_models'
        for node_id, node in manifest.get("metrics", {}).items():
            metrics.append({
                "name": node.get("name"),
                "description": node.get("description"),
                "type": "dbt_native",
                "sql": node.get("expression") or node.get("calculation_method"),
                "filters": []
            })

        datasets = []
        for node_id, node in manifest.get("nodes", {}).items():
            if node.get("resource_type") == "model":
                datasets.append({
                    "name": node.get("name"),
                    "columns": list(node.get("columns", {}).keys())
                })

        return {
            "metrics": metrics,
            "datasets": datasets
        }

# Example usage (not instantiated by default)
# dbt_adapter = DbtAdapter("path/to/target/manifest.json")
