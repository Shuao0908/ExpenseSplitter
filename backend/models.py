from sqlalchemy import Column, Integer, String, ForeignKey, DECIMAL, Date, TIMESTAMP, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    
    userID = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    registrationDate = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    groups_created = relationship("Group", back_populates="creator")
    expenses_paid = relationship("Expense", back_populates="payer")
    settlements_paid = relationship("Settlement", foreign_keys='Settlement.payerID', back_populates="payer")
    settlements_received = relationship("Settlement", foreign_keys='Settlement.receiverID', back_populates="receiver")

class Group(Base):
    __tablename__ = "groups"
    
    groupID = Column(Integer, primary_key=True, autoincrement=True)
    groupName = Column(String(255), nullable=False)
    createdDate = Column(TIMESTAMP, server_default=func.current_timestamp())
    createdBy = Column(Integer, ForeignKey("users.userID"))
    
    creator = relationship("User", back_populates="groups_created")
    expenses = relationship("Expense", back_populates="group")
    members = relationship("User", secondary="usergroup")

class UserGroup(Base):
    __tablename__ = "usergroup"
    
    userID = Column(Integer, ForeignKey("users.userID"), primary_key=True)
    groupID = Column(Integer, ForeignKey("groups.groupID"), primary_key=True)
    joinDate = Column(TIMESTAMP, server_default=func.current_timestamp())

class ExpenseCategory(Base):
    __tablename__ = "expensecategories"
    
    categoryID = Column(Integer, primary_key=True, autoincrement=True)
    categoryName = Column(String(100), nullable=False)
    
    expenses = relationship("Expense", back_populates="category")

class Expense(Base):
    __tablename__ = "expenses"
    
    expenseID = Column(Integer, primary_key=True, autoincrement=True)
    groupID = Column(Integer, ForeignKey("groups.groupID"), nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    categoryID = Column(Integer, ForeignKey("expensecategories.categoryID"))
    expenseDate = Column(Date, nullable=False)
    payerID = Column(Integer, ForeignKey("users.userID"), nullable=False)
    createdAt = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    group = relationship("Group", back_populates="expenses")
    category = relationship("ExpenseCategory", back_populates="expenses")
    payer = relationship("User", back_populates="expenses_paid")
    settlements = relationship("Settlement", back_populates="expense")

class Settlement(Base):
    __tablename__ = "settlements"
    
    settlementID = Column(Integer, primary_key=True, autoincrement=True)
    expenseID = Column(Integer, ForeignKey("expenses.expenseID"), nullable=False)
    payerID = Column(Integer, ForeignKey("users.userID"), nullable=False)
    receiverID = Column(Integer, ForeignKey("users.userID"), nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    settlementDate = Column(TIMESTAMP, server_default=func.current_timestamp())
    status = Column(Enum("PENDING", "COMPLETED", name="settlement_status"), server_default="PENDING")
    
    expense = relationship("Expense", back_populates="settlements")
    payer = relationship("User", foreign_keys=[payerID], back_populates="settlements_paid")
    receiver = relationship("User", foreign_keys=[receiverID], back_populates="settlements_received")
