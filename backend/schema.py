from pydantic import BaseModel
from typing import List

# Define the data model for the request body
class GroupCreate(BaseModel):
    groupName: str
    createdBy: str
    participants: List[str]  # List of user IDs

class GroupDetails(BaseModel):
    group_id: int
    groupName: str
    createdBy: str
    createdDate: str
    participants: List[str]

    class Config:
        orm_mode = True  # This allows Pydantic to work with SQLAlchemy models