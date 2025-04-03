# FastAPI main app
from fastapi import FastAPI, HTTPException, Depends
from routes import users, expenses, settlements
from database import engine
import models
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from models import User, Group, UserGroup, Expense, ExpenseCategory, Settlement
from sqlalchemy import MetaData
from pydantic import BaseModel
from database import SessionLocal
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from schema import GroupDetails, GroupCreate, ExactSplit, ExpenseCreate, ExpenseSchema,SettlementSchema

app = FastAPI()

# Create database tables
meta = MetaData()
meta.create_all(bind=engine, tables=[models.Group.__table__, models.Expense.__table__])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
# Include Routes
# app.include_router(users.router)
# app.include_router(expenses.router)
# app.include_router(settlements.router)

@app.get("/")
def home():
    return {"message": "Welcome to Expense Splitting App"}

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()





# Function to create a group
def create_group(db: Session, groupName: str, createdBy: str, createdAt: str):
    # Fetch the userID based on the provided email
    user = db.query(User).filter(User.email == createdBy).first()
    
    if not user:
        raise ValueError(f"User with email {createdBy} not found")

    # Create the group with the found userID
    db_group = Group(groupName=groupName, createdBy=user.userID, createdDate=createdAt)
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    
    return db_group

# Function to insert participants into usergroup based on emails
def insert_participants_by_email(db: Session, groupID: int, emails: list):
    try:
        # Fetch user IDs based on emails
        users = db.query(User).filter(User.email.in_(emails)).all()
        
        if not users:
            raise HTTPException(status_code=404, detail="No users found for the given emails")
        
        # Insert participants into the usergroup table
        for user in users:
            db_usergroup = UserGroup(userID=user.userID, groupID=groupID, joinDate=datetime.now())
            db.add(db_usergroup)

        db.commit()

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred while inserting participants")

# POST route to create a group
@app.post("/create-group")
async def create_group_endpoint(group: GroupCreate, db: Session = Depends(get_db)):
    group_name = group.groupName
    created_by = group.createdBy
    created_at = datetime.now()
    participants = group.participants

    print(group)
    print("✅ Group Name:", group_name)
    print("✅ Created By:", created_by)
    print("✅ Created At:", created_at)
    print("✅ Participants:", participants)
    # Validate input
    if not group_name or not created_by:
        raise HTTPException(status_code=400, detail="Group name and creator are required")

    # Create group in the database
    db_group = create_group(db, group_name, created_by, created_at)

    # Insert participants into the usergroup table
    if participants:
        insert_participants_by_email(db, db_group.groupID, participants)

    return {"success": True, "group_id": db_group.groupID}


# Endpoint to fetch groups that a user is involved in (as creator or participant)
@app.get("/user-groups", response_model=List[GroupDetails])
async def get_user_groups(email: str, db: Session = Depends(get_db)):
    print(f"Fetching groups for email: {email}") 

    # Fetch user IDs based on emails
    users = db.query(User).filter(User.email == email).first()
    if not users:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch groups where the user is the creator
    creator_groups = db.query(Group).filter(Group.createdBy == users.userID).all()
    print(f"Creator groups: {creator_groups}")

    if not creator_groups:
        raise HTTPException(status_code=404, detail="No groups found for this user as creator")

    # Fetch groups where the user is a participant
    participant_groups = (db.query(Group).join(UserGroup).filter(UserGroup.userID == User.userID).all())
    print(f"Participant groups: {participant_groups}")

    # Combine both lists (creator and participant)
    all_groups = {group.groupID: group for group in creator_groups + participant_groups}.values()
    print(f"All groups: {all_groups}")

    # Prepare the response with group details
    group_details = []
    
    for group in all_groups:
        participants = [
            {
                "userID": user.userID,
                "email": user.email,
                "name": user.name
            }
            for user in db.query(User).join(UserGroup).filter(UserGroup.groupID == group.groupID).all()
        ]

        # Get the user email for the creator
        creator_user = db.query(User).filter(User.userID == group.createdBy).first()
        if creator_user:
            creator_info = {
                "userID": creator_user.userID,
                "email": creator_user.email,
                "name": creator_user.name
            }
        else:
            creator_info = {"userID": 0, "email": "Unknown", "name": "Unknown"}

        group_details.append(
            GroupDetails(
                group_id=group.groupID,
                groupName=group.groupName,
                createdBy=creator_info , 
                createdDate=group.createdDate.isoformat(),
                participants=participants
            )
        )

    return group_details

@app.post("/add-expense", response_model=dict)
async def add_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    try:
        # Create the expense record
        new_expense = Expense(
            groupID=expense.groupID,
            amount=expense.amount,
            category=expense.category,
            expenseDate=expense.expenseDate,
            payerID=expense.payerID,
            createdAt=datetime.now()
        )
        print(new_expense)
        db.add(new_expense)
        db.commit()
        db.refresh(new_expense)

        # If splits are provided, process them
        if expense.splits:
            total_split = sum(split.amount for split in expense.splits)
            if abs(total_split - expense.amount) > 0.01:
                # Amounts don't add up. Raise an error.
                raise HTTPException(
                    status_code=400, 
                    detail="The split amounts do not sum up to the total expense amount."
                )
            
            # Create a settlement record for each split
            for split in expense.splits:
                new_settlement = Settlement(
                    expenseID=new_expense.expenseID,
                    payerID=expense.payerID,    # The person who paid
                    receiverID=split.userID,     # The person owing a share
                    amount=split.amount,
                    status='PENDING'
                )
                db.add(new_settlement)
                db.commit()
        else:
            # If no splits provided, assume an equal split or handle as needed
            pass

        return {"success": True, "expenseID": new_expense.expenseID}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/expenses/{groupID}", response_model=List[ExpenseSchema])  
def get_expenses(groupID: int, db: Session = Depends(get_db)):  
    expenses = db.query(Expense).filter(Expense.groupID == groupID).all()
    return expenses

# Helper function to get the user's group IDs
def get_user_group_ids(email: str, db: Session):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch groups where the user is the creator
    creator_groups = db.query(Group.groupID).filter(Group.createdBy == user.userID).all()
    
    # Fetch groups where the user is a participant
    participant_groups = db.query(UserGroup.groupID).filter(UserGroup.userID == user.userID).all()

    # Combine group IDs, removing duplicates
    group_ids = list({gid[0] for gid in creator_groups + participant_groups})
    
    print(f"User {email} is involved in group IDs: {group_ids}")

    return group_ids

@app.get("/settlements/{email}", response_model=List[SettlementSchema])
def get_user_settlements(email: str, db: Session = Depends(get_db)):
    group_ids = get_user_group_ids(email, db)
    
    settlements = db.query(Settlement).join(Expense, Settlement.expenseID == Expense.expenseID).filter(Expense.groupID.in_(group_ids)).all()
    # Convert ORM objects to response format
    response = [
        SettlementSchema(
            settlementID=s.settlementID,
            expenseID=s.expenseID,
            payerID=s.payerID,
            receiverID=s.receiverID,
            amount=s.amount,
            settlementDate=s.settlementDate.date(),  # Convert datetime to date
            status=s.status,
            groupID=s.expense.groupID  # Ensure groupID is included
        )
        for s in settlements
    ]
    print(response)
    
    return response




# ✅ UPDATE a settlement (mark as completed)
@app.put("/settlements/{settlement_id}", response_model=SettlementSchema)
def update_settlement(settlement_id: int, db: Session = Depends(get_db)):
    settlement = db.query(Settlement).filter(Settlement.settlementID == settlement_id).first()
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    
    settlement.status = "COMPLETED"
    db.commit()
    db.refresh(settlement)
    return settlement



# Allow frontend requests from http://127.0.0.1:5500
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Use ["http://127.0.0.1:5500"] for better security
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE)
    allow_headers=["*"],  # Allow all headers
)