from datetime import date
from pydantic import BaseModel
from typing import List, Optional

# Define the data model for the request body
class GroupCreate(BaseModel):
    groupName: str
    createdBy: str
    participants: List[str]  # List of user IDs

class UserInfo(BaseModel):
    userID: int
    email: str
    name: str

class GroupDetails(BaseModel):
    group_id: int
    groupName: str
    createdBy: UserInfo
    createdDate: str
    participants: List

    class Config:
        orm_mode = True  # This allows Pydantic to work with SQLAlchemy models

class ExactSplit(BaseModel):
    userID: int
    amount: float

class ExpenseCreate(BaseModel):
    groupID: int
    amount: float
    category: str
    expenseDate: date  # ISO date (YYYY-MM-DD)
    payerID: int
    splits: Optional[List[ExactSplit]] = None 

class ExpenseSchema(BaseModel):
    expenseID: int
    groupID: int
    amount: float
    category: str
    expenseDate: date
    payerID: int

    class Config:
        from_attributes = True  # This allows ORM conversion

class SettlementSchema(BaseModel):
    settlementID: int
    expenseID: int
    payerID: int
    receiverID: int    
    amount: float
    settlementDate: date
    status:str
    groupID: int

    class Config:
        from_attributes = True  # Enable ORM conversion