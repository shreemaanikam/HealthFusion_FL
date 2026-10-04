from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime

class AssessmentHistoryResponse(BaseModel):
    id: int
    input_data: Dict[str, Any]
    prediction: int
    probability: float
    risk_level: str
    created_at: datetime
