from fastapi import APIRouter
from fastapi_cache.decorator import cache
from app.services.semantic_layer.parser import semantic_parser

router = APIRouter()

@router.get("/")
@cache(expire=300)
def get_lineage():
    """
    Returns a graph representation of the semantic layer relationships.
    Nodes: Metrics, Tables
    Edges: Metric -> Table (dependency)
    """
    try:
        data = semantic_parser._load()
        metrics = data.get("metrics", [])
        tables = data.get("datasets", [])
        
        nodes = []
        links = []
        
        # Add Dataset nodes
        for table in tables:
            nodes.append({
                "id": table["name"],
                "type": "table",
                "label": table["name"]
            })
            
        # Add Metric nodes and links
        for metric in metrics:
            metric_id = f"m_{metric['name']}"
            nodes.append({
                "id": metric_id,
                "type": "metric",
                "label": metric["name"]
            })
            
            # Simple heuristic: if metric sql contains table name, create link
            for table in tables:
                if table["name"].lower() in metric["sql"].lower():
                    links.append({
                        "source": metric_id,
                        "target": table["name"]
                    })
                    
        return {"nodes": nodes, "links": links}
    except Exception as e:
        return {"nodes": [], "links": [], "error": str(e)}
