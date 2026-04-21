from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from app.models.base import Base

class SavedWorkspace(Base):
    __tablename__ = "saved_workspaces"

    id = Column(Integer, primary_key=True, index=True)
    user_query = Column(Text, nullable=False)
    generated_sql = Column(Text, nullable=False)
    insight_narrative = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # We store the result payload as a JSON string for simplicity in this demo
    # In a real app, you might store result metadata or reference a cache key
    results_json = Column(Text, nullable=True)
