# Database connection
from sqlalchemy.ext.declarative import declarative_base
import os

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker
from sqlalchemy import MetaData, create_engine
meta = MetaData()

# DATABASE_URL = os.getenv("DATABASE_URL", "mysql+mysqlconnector://user:password@azure-mysql-db/expense_db")
DATABASE_URL= "mysql+mysqlconnector://root:@localhost:3306/expensesplitter"
# DATABASE_URL= "mssql+pyodbc://admin-expense:Password123@expense-splitter-sql-server.database.windows.net:1433/expense-splitter-sql?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=no&Encrypt=yes"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

# import os
# import mysql.connector
# from azure.identity import DefaultAzureCredential
# from azure.keyvault.secrets import SecretClient

# def get_db_connection():
#     key_vault_url = os.environ["KEY_VAULT_URL"]
#     credential = DefaultAzureCredential()
#     client = SecretClient(vault_url=key_vault_url, credential=credential)

#     db_host = client.get_secret("db-host").value
#     db_user = client.get_secret("db-user").value
#     db_pass = client.get_secret("db-password").value
#     db_name = client.get_secret("db-name").value

#     return mysql.connector.connect(
#         host=db_host,
#         user=db_user,
#         password=db_pass,
#         database=db_name
#     )
