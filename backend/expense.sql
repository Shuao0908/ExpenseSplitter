-- Users Table
CREATE TABLE Users (
    userID INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    registrationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Groups Table
CREATE TABLE `Groups` (
    groupID INT AUTO_INCREMENT PRIMARY KEY,
    groupName VARCHAR(255) NOT NULL,
    createdDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdBy INT,
    FOREIGN KEY (createdBy) REFERENCES Users(userID)
);

-- UserGroup Junction Table (Many-to-Many Relationship)
CREATE TABLE UserGroup (
    userID INT,
    groupID INT,
    joinDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (userID, groupID),
    FOREIGN KEY (userID) REFERENCES Users(userID),
    FOREIGN KEY (groupID) REFERENCES `Groups`(groupID)
);

-- Expense Categories
CREATE TABLE ExpenseCategories (
    categoryID INT AUTO_INCREMENT PRIMARY KEY,
    categoryName VARCHAR(100) NOT NULL
);

-- Expenses Table
CREATE TABLE Expenses (
    expenseID INT AUTO_INCREMENT PRIMARY KEY,
    groupID INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    categoryID INT,
    expenseDate DATE NOT NULL,
    payerID INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (groupID) REFERENCES `Groups`(groupID),
    FOREIGN KEY (categoryID) REFERENCES ExpenseCategories(categoryID),
    FOREIGN KEY (payerID) REFERENCES Users(userID)
);

-- Settlements Table
CREATE TABLE Settlements (
    settlementID INT AUTO_INCREMENT PRIMARY KEY,
    expenseID INT NOT NULL,
    payerID INT NOT NULL,
    receiverID INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    settlementDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'COMPLETED') DEFAULT 'PENDING',
    FOREIGN KEY (expenseID) REFERENCES Expenses(expenseID),
    FOREIGN KEY (payerID) REFERENCES Users(userID),
    FOREIGN KEY (receiverID) REFERENCES Users(userID)
);

-- Predefined Expense Categories
INSERT INTO ExpenseCategories (categoryName) VALUES 
('Food'),
('Transportation'),
('Utilities'),
('Rent'),
('Entertainment'),
('Groceries'),
('Travel'),
('Miscellaneous');

-- Indexes for Performance Optimization
CREATE INDEX idx_group_expenses ON Expenses(groupID);
CREATE INDEX idx_expense_payer ON Expenses(payerID);
CREATE INDEX idx_settlement_payer ON Settlements(payerID);
CREATE INDEX idx_settlement_receiver ON Settlements(receiverID);
CREATE INDEX idx_user_group ON UserGroup(userID, groupID);

-- Additional Constraints and Checks
ALTER TABLE Expenses 
ADD CONSTRAINT chk_positive_amount 
CHECK (amount > 0);

ALTER TABLE Settlements 
ADD CONSTRAINT chk_settlement_amount 
CHECK (amount > 0);