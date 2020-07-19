from datetime import date, datetime, timedelta
from typing import List, Dict
from pydantic import BaseModel

class Project(BaseModel):
    name: str