# FastAPI main app
from fastapi import FastAPI
from routes import users, expenses, settlements
from database import engine
import models
from sqlalchemy import MetaData

app = FastAPI()

# Create database tables
meta = MetaData()
meta.create_all(bind=engine, tables=[models.Group.__table__, models.Expense.__table__])

# Include Routes
# app.include_router(users.router)
# app.include_router(expenses.router)
# app.include_router(settlements.router)

@app.get("/")
def home():
    return {"message": "Welcome to Expense Splitting App"}
