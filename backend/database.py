# Database connection
from sqlalchemy.ext.declarative import declarative_base
import os

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker
from sqlalchemy import MetaData, create_engine
meta = MetaData()

# DATABASE_URL = os.getenv("DATABASE_URL", "mysql+mysqlconnector://user:password@azure-mysql-db/expense_db")
DATABASE_URL= "mysql+mysqlconnector://root:@localhost:3306/expensesplitter"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

# DATABASE_URL = "mysql+mysqlconnector://mysqladmin:MySecureP@ssw0rd@expense-mysql-flexible.mysql.database.azure.com/expense_db"

# engine = create_engine(DATABASE_URL)
# SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
# Base = declarative_base()

