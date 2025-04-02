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
from schema import GroupDetails, GroupCreate

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
    # participant_groups = db.query(Group).join(UserGroup).join(User).filter(User.email == email).all()
    participant_groups = (db.query(Group).join(UserGroup).filter(UserGroup.userID == User.userID).all())
    print(f"Participant groups: {participant_groups}")

    # Combine both lists (creator and participant)
    # all_groups = creator_groups + participant_groups
    all_groups = {group.groupID: group for group in creator_groups + participant_groups}.values()
    print(f"All groups: {all_groups}")

    # Prepare the response with group details
    group_details = []
    
    for group in all_groups:
        # Get participants emails for the group
        participant_emails = [
            user.email for user in db.query(User).join(UserGroup).filter(UserGroup.groupID == group.groupID).all()
        ]
        # participants = [
        #     {
        #         "userID": user.userID,
        #         "email": user.email,
        #         "name": user.name
        #     }
        #     for user in db.query(User).join(UserGroup).filter(UserGroup.groupID == group.groupID).all()
        # ]

        # Get the user email for the creator
        creator_user = db.query(User).filter(User.userID == group.createdBy).first()
        created_by_email = creator_user.name if creator_user else "Unknown"

        group_details.append(
            GroupDetails(
                group_id=group.groupID,
                groupName=group.groupName,
                createdBy=created_by_email,  # The email of the creator
                createdDate=group.createdDate.isoformat(),
                participants=participant_emails
                # participants=participants
            )
        )

    return group_details




# Allow frontend requests from http://127.0.0.1:5500
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Use ["http://127.0.0.1:5500"] for better security
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE)
    allow_headers=["*"],  # Allow all headers
)