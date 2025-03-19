# FastAPI main app
from fastapi import FastAPI
from routes import users, expenses, settlements
from database import engine
import models

app = FastAPI()

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Include Routes
app.include_router(users.router)
app.include_router(expenses.router)
app.include_router(settlements.router)

@app.get("/")
def home():
    return {"message": "Welcome to Expense Splitting App"}
