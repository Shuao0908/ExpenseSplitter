const API_URL = "http://localhost:8000";
// Alert functionality
function showAlert(message, type = 'info', container = 'sections-container', duration = 5000) {
    // Create alert element
    const alertId = 'alert-' + Date.now();
    const alertDiv = document.createElement('div');
    alertDiv.id = alertId;
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.maxWidth = '400px';
    alertDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'close';
    closeButton.setAttribute('data-dismiss', 'alert');
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.innerHTML = '<span aria-hidden="true">&times;</span>';
    
    // Add event listener to close button
    closeButton.addEventListener('click', function() {
        document.getElementById(alertId).remove();
    });
    
    // Set message content
    const iconMap = {
        'success': '✓',
        'danger': '✗',
        'warning': '⚠',
        'info': 'ℹ'
    };
    const icon = document.createElement('span');
    icon.style.marginRight = '10px';
    icon.style.fontWeight = 'bold';
    icon.textContent = iconMap[type] || 'ℹ';
    
    const messageText = document.createElement('span');
    messageText.textContent = message;
    
    // Append elements
    alertDiv.appendChild(icon);
    alertDiv.appendChild(messageText);
    alertDiv.appendChild(closeButton);
    
    // Insert into body (fixed position makes container less relevant)
    document.body.appendChild(alertDiv);
    
    // Auto-dismiss after duration (if specified)
    if (duration > 0) {
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                // Add fade out animation
                alertElement.style.opacity = '0';
                alertElement.style.transform = 'translateY(-10px)';
                alertElement.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                
                // Remove after animation completes
                setTimeout(() => {
                    if (alertElement && alertElement.parentNode) {
                        alertElement.parentNode.removeChild(alertElement);
                    }
                }, 500);
            }
        }, duration);
    }
    
    return alertId;
}

// Helper functions for different alert types
function showSuccess(message) {
    return showAlert(message, 'success');
}

function showError(message) {
    return showAlert(message, 'danger');
}

function showWarning(message) {
    return showAlert(message, 'warning');
}

function showInfo(message) {
    return showAlert(message, 'info');
}

// Original script with alert integrations
let groups = [];
let expenses = [];
let participants = [];
let participantsData = {};
let allSettlements = [];

window.onload = function () {
    getUserGroups();
    fetchSettlements();
    addEventListeners();
    // Show welcome message
    showInfo("Welcome to ExpenseSplit! Select a group to get started.");
}

function addEventListeners() {
    const groupSelect = document.getElementById("groupSelect");
    groupSelect.addEventListener("change", function () { 
        updatePayerDropdown(this.value); 
        showInfo(`Group selected: ${this.options[this.selectedIndex].text}`);
    });
    
    document.getElementById("splitType").addEventListener("change", toggleSplitInputs);
    
    // Event listeners for filters
    document.getElementById("groupFilter").addEventListener("change", filterSettlements);
    document.getElementById("payerFilter").addEventListener("change", filterSettlements);
    document.getElementById("receiverFilter").addEventListener("change", filterSettlements);
}

function addParticipant() {
    let participantEmail = $("#participantEmail").val().trim();
    // Validate email input
    if (!participantEmail) {
        showError("Please enter a valid email.");
        return;
    }

    if (participants.includes(participantEmail)) {
        showWarning("This participant is already added.");
        return;
    }
    
    // Add participant to the array
    participants.push(participantEmail);

    // Update the participant list UI
    $("#participantList").append(`<li class='list-group-item'>${participantEmail} 
        <button class="btn btn-sm btn-danger float-end" onclick="removeParticipant('${participantEmail}')">Remove</button></li>`);
    $("#participantEmail").val("");
    
    showSuccess(`Participant ${participantEmail} added successfully!`);
}

function removeParticipant(email) {
    // Remove from array
    participants = participants.filter(participant => participant !== email);

    // Remove from UI
    $("#participantList").html("");
    participants.forEach(email => {
        $("#participantList").append(`<li class='list-group-item'>${email} 
            <button class="btn btn-sm btn-danger float-end" onclick="removeParticipant('${email}')">Remove</button>
        </li>`);
    });
    
    showInfo(`Participant ${email} removed.`);
}

function createGroup() {
    let groupName = $("#groupName").val();
    let createdBy = $("#createdBy").val();
    let createdAt = new Date().toLocaleString();
    let participantEmail = $("#participantEmail").val();
    
    if (!groupName || !createdBy) {
        showError("Please enter a group name and your email.");
        return;
    }
    
    let group = { groupName: groupName, createdBy, participants: participants };

    // Show loading message
    const loadingId = showInfo("Creating group...");

    // Send POST request to the backend
    fetch("http://127.0.0.1:8000/create-group", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(group)
    })
    .then(response => response.json())
    .then(data => {
        // Remove loading message
        document.getElementById(loadingId)?.remove();
        
        if (data.success) {
            // Append the new group to the list
            $("#groupList").append(`<li class='list-group-item'>${groupName} (Created by: ${createdBy} on ${createdAt})</li>`);
            $("#groupSelect").append(`<option>${groupName}</option>`);

            // Clear input fields
            $("#groupName, #createdBy").val("");
            participants = [];
            $("#participantList").empty();
            
            showSuccess(`Group "${groupName}" created successfully!`);
            getUserGroups();
        } else {
            showError("Error creating group. Please try again.");
        }
    })
    .catch(error => {
        // Remove loading message
        document.getElementById(loadingId)?.remove();
        
        console.error("Error:", error);
        showError("There was an error while creating the group.");
    });
}

async function getUserGroups() {
    const email = "innocwentxuan@gmail.com";
    if (!email) {
        showError("Please enter a valid email");
        return;
    }

    // Show loading message
    const loadingId = showInfo("Loading your groups...");

    try {
        // Fetch data from FastAPI endpoint
        const response = await fetch(`http://127.0.0.1:8000/user-groups?email=${email}`);

        // Remove loading message
        document.getElementById(loadingId)?.remove();

        if (!response.ok) { 
            throw new Error("Failed to fetch groups"); 
        }
        
        const groups = await response.json();

        // Clear the previous group list
        document.getElementById("groups-list").innerHTML = "";
        const groupSelect = document.getElementById("groupSelect");
        groupSelect.innerHTML = "";
        console.log("group select");
        const groupSelect2 = document.getElementById("groupSelect2");
        groupSelect2.innerHTML = "";
        
        // Add placeholder option
        const placeholderOption = document.createElement("option");
        placeholderOption.value = "";
        placeholderOption.textContent = "Select a Group";
        groupSelect.appendChild(placeholderOption);
        groupSelect2.appendChild(placeholderOption);

        if (groups.length === 0) {
            document.getElementById("groups-list").innerHTML = "You are not involved in any groups.";
            groupSelect.innerHTML = `<option value="">No groups available</option>`;
            showInfo("You are not involved in any groups yet. Create a new group to get started!");
            return;
        }

        // Create a group display for each group
        groups.forEach(group => {
            participantsData[group.group_id] = [
                { userID: group.createdBy.userID, email: group.createdBy.email, name: group.createdBy.name },
                ...group.participants
            ];

            const groupElement = document.createElement("div");
            groupElement.classList.add("group");

            groupElement.innerHTML = `<h3>${group.groupName}</h3>
                                      <p><strong>Created By:</strong> ${group.createdBy.name}</p>
                                      <p><strong>Created On:</strong> ${new Date(group.createdDate).toLocaleString()}</p>
                                      <div class="participants">
                                      <div class="participants">\n<strong>Participants:</strong> ${group.participants.map(p => p.name).join(", ")}\n</div>`;

            document.getElementById("groups-list").appendChild(groupElement);

            const option = document.createElement("option");
            const option2 = document.createElement("option");
            option.value = group.group_id; // Use group ID as value
            option.textContent = group.groupName; // Display group name
            option2.value = group.group_id; // Use group ID as value
            option2.textContent = group.groupName; // Display group name
            console.log(option);
            groupSelect.appendChild(option);
            groupSelect2.appendChild(option2);
        });
        
        showSuccess(`${groups.length} groups loaded successfully!`);
    } catch (error) {
        // Remove loading message
        document.getElementById(loadingId)?.remove();
        
        console.error(error);
        showError("Error fetching group data. Please try again later.");
    }
}

function updatePayerDropdown(groupId) {
    const payerSelect = document.getElementById("payer");
    payerSelect.innerHTML = '';
    payerSelect.innerHTML = `<option value="">Select a Payer</option>`;
    
    if (!groupId || !participantsData[groupId]) {
        showWarning("No participants found for this group.");
        return;
    }

    participantsData[groupId].forEach(userEmail => {
        const option = document.createElement("option");
        option.value = userEmail.userID;
        option.textContent = userEmail.name;
        payerSelect.appendChild(option);
    });
    
    showInfo(`${participantsData[groupId].length} participants loaded for this group.`);
}

function setCategory(category) {
    document.getElementById("categoryInput").value = category;
    showInfo(`Category "${category}" selected.`);
}

function toggleSplitInputs() {
    const splitType = document.getElementById("splitType").value;
    const equalSplitDisplay = document.getElementById("equalSplitDisplay");
    const exactSplitInputs = document.getElementById("exactSplitInputs");
    
    if (splitType === "exact") {
        exactSplitInputs.style.display = "block";
        equalSplitDisplay.style.display = "none";
        showInfo("Exact split selected. Add each participant's share.");
    } else { // equal split
        exactSplitInputs.style.display = "none";
        equalSplitDisplay.style.display = "block";
        computeEqualSplit();
        showInfo("Equal split selected. Amount will be divided equally.");
    }
}

function computeEqualSplit() {
    const amountInput = document.getElementById("amount").value;
    const groupSelect = document.getElementById("groupSelect").value;
    const equalSplitDisplay = document.getElementById("equalSplitDisplay");

    if (!amountInput || !groupSelect) {
        equalSplitDisplay.innerHTML = "";
        return;
    }
    
    const totalAmount = parseFloat(amountInput);
    // Retrieve participants from stored data for the selected group
    const groupParticipants = participantsData[groupSelect];
    
    if (!groupParticipants || groupParticipants.length === 0) {
        equalSplitDisplay.innerHTML = "No participants available for equal split.";
        showWarning("No participants available for equal split.");
        return;
    }
    
    const share = (totalAmount / groupParticipants.length).toFixed(2);
    equalSplitDisplay.innerHTML = `Each participant should pay: $${share}`;
}

function addExactSplit() {
    const container = document.getElementById("splitEntries");
    const groupID = document.getElementById("groupSelect").value;
    
    if (!groupID || !participantsData[groupID] || participantsData[groupID].length === 0) {
        showError("No participants available for this group.");
        return;
    }

    // Create a new div for the exact split entry
    const div = document.createElement("div");
    div.classList.add("split-entry");

    // Create the user dropdown
    let userSelectHTML = `<select class="form-control mb-2 split-userID" style="width: 30%; display:inline-block; margin-right:10px;">`;
    participantsData[groupID].forEach(participant => {
        userSelectHTML += `<option value="${participant.userID}">${participant.name}</option>`;
    });
    userSelectHTML += `</select>`;

    // Set the inner HTML with the user dropdown
    div.innerHTML = `${userSelectHTML}
        <input type="number" placeholder="Amount" class="form-control mb-2 split-amount" style="width: 25%; display:inline-block; margin-right:10px;">
        <button type="button" class="btn btn-danger" onclick="this.parentNode.remove()">Remove</button>`;

    // Append the new split entry
    container.appendChild(div);
    
    showInfo("Split entry added. Specify the amount for this participant.");
}

function addExpense() {
    let groupID = document.getElementById("groupSelect").value;
    let amount = document.getElementById("amount").value;
    let category = document.getElementById("categoryInput").value;
    let expenseDate = '2025-04-03';
    let payerID = document.getElementById("payer").value;
    let splitType = document.getElementById("splitType").value;

    if (!groupID || !amount || !category || !expenseDate || !payerID) {
        showError("Please fill in all fields.");
        return;
    }

    let expenseData = {
        groupID: parseInt(groupID),
        amount: parseFloat(amount),
        category: category,
        expenseDate: expenseDate,  // in YYYY-MM-DD format
        payerID: parseInt(payerID)
    };
    
    // Show loading message
    const loadingId = showInfo("Adding expense...");

    if (splitType === "exact") {
        // Collect exact splits
        let splits = [];
        const entries = document.querySelectorAll(".split-entry");
        
        // Validate that at least one split entry exists
        if (entries.length === 0) {
            showError("Please add at least one split entry.");
            document.getElementById(loadingId)?.remove();
            return;
        }
        
        // Calculate total split amount
        let totalSplitAmount = 0;
        
        entries.forEach(entry => {
            const userID = parseInt(entry.querySelector(".split-userID").value);
            const splitAmount = parseFloat(entry.querySelector(".split-amount").value);
            
            if (isNaN(splitAmount)) {
                showError("Please enter valid amounts for all split entries.");
                document.getElementById(loadingId)?.remove();
                return;
            }
            
            totalSplitAmount += splitAmount;
            splits.push({ userID: userID, amount: splitAmount });
        });
        
        // Validate total split amount
        if (Math.abs(totalSplitAmount - parseFloat(amount)) > 0.01) {
            showWarning(`Split amounts ($${totalSplitAmount.toFixed(2)}) don't match total expense ($${parseFloat(amount).toFixed(2)}). Proceeding anyway.`);
        }
        
        expenseData.splits = splits;
    } else if (splitType === "equal") {
        // Generate equal splits
        const groupParticipants = participantsData[groupID];
        if (!groupParticipants || groupParticipants.length === 0) {
            showError("No participants available for equal split.");
            document.getElementById(loadingId)?.remove();
            return;
        }

        const perPersonShare = (parseFloat(amount) / groupParticipants.length).toFixed(2);
        expenseData.splits = groupParticipants.map(user => ({
            userID: user.userID,
            amount: parseFloat(perPersonShare)
        }));
    }

    fetch("http://127.0.0.1:8000/add-expense", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(expenseData)
    })
    .then(response => {
        // Remove loading message
        document.getElementById(loadingId)?.remove();
        
        if (!response.ok) { 
            throw new Error("Failed to add expense"); 
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showSuccess(`Expense added successfully! Expense ID: ${data.expenseID}`);
            
            // Reset form
            document.getElementById("groupSelect").value = "";
            document.getElementById("amount").value = "";
            document.getElementById("categoryInput").value = "";
            document.getElementById("payer").value = "";
            document.getElementById("splitType").value = ""; // Reset split type to default
            document.getElementById("exactSplitInputs").style.display = "none"; // Hide exact split inputs
            document.getElementById("splitEntries").innerHTML = ""; // Clear exact split entries
            document.getElementById("equalSplitDisplay").innerHTML = ""; // Clear equal split display
        } else {
            showError("Failed to add expense. Please try again.");
        }
    })
    .catch(error => {
        // Remove loading message
        document.getElementById(loadingId)?.remove();
        
        console.error("Error adding expense:", error);
        showError("An error occurred while adding the expense.");
    });
}

function fetchExpenses() {
    const groupID = document.getElementById("groupSelect2").value;
    if (!groupID) {
        showError("Please select a group.");
        return;
    }

    // Show loading message
    const loadingId = showInfo("Loading expenses...");

    fetch(`http://127.0.0.1:8000/expenses/${groupID}`)
        .then(response => {
            // Remove loading message
            document.getElementById(loadingId)?.remove();
            
            if (!response.ok) throw new Error("Failed to fetch expenses");
            return response.json();
        })
        .then(expenses => {
            renderExpenses(expenses);
            showSuccess(`${expenses.length} expenses loaded successfully!`);
        })
        .catch(error => {
            // Remove loading message
            document.getElementById(loadingId)?.remove();
            
            console.error("Error fetching expenses:", error);
            showError("Could not load expenses. Please try again.");
        });
}

function renderExpenses(expenses) {
    const expenseList = document.getElementById("expenseList");
    expenseList.innerHTML = ""; // Clear previous data

    if (expenses.length === 0) {
        expenseList.innerHTML = "<p>No transactions found.</p>";
        showInfo("No transactions found for this group.");
        return;
    }

    expenses.forEach(expense => {
        const transactionItem = document.createElement("div");
        transactionItem.classList.add("transaction-item");

        transactionItem.innerHTML = `<div class="transaction-card">
                                        <div class="transaction-details">
                                            <p><strong>${expense.category}</strong></p>
                                            <p class="transaction-date">${formatDate(expense.expenseDate)}</p>
                                        </div>
                                        <p class="transaction-amount">$${expense.amount.toFixed(2)}</p>
                                    </div>`;

        expenseList.appendChild(transactionItem);
    });
}

// Helper function to format date
function formatDate(dateString) {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
}

async function fetchSettlements() {
    const userEmail = "innocwentxuan@gmail.com";  // Replace with actual user email

    // Show loading message
    const loadingId = showInfo("Loading settlements...");

    try {
        const response = await fetch(`http://127.0.0.1:8000/settlements/${userEmail}`);
        const data = await response.json();
        
        // Remove loading message
        document.getElementById(loadingId)?.remove();
        
        allSettlements = data;
        populateFilters();
        renderTable(data);
        
        showSuccess(`${data.length} settlements loaded successfully!`);
    } catch (error) {
        // Remove loading message
        document.getElementById(loadingId)?.remove();
        
        console.error("Error fetching settlements:", error);
        showError("Could not load settlements. Please try again.");
    }
}

// Populate dropdown filters dynamically
function populateFilters() {
    const groups = new Set(), payers = new Set(), receivers = new Set();

    allSettlements.forEach(s => {
        groups.add(s.groupID);
        payers.add(s.payerID);
        receivers.add(s.receiverID);
    });

    populateDropdown("groupFilter", groups);
    populateDropdown("payerFilter", payers);
    populateDropdown("receiverFilter", receivers);
}

function populateDropdown(id, values) {
    const select = document.getElementById(id);
    select.innerHTML = '<option value="">All</option>'; // Reset with default option
    
    values.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = `ID ${value}`;
        select.appendChild(option);
    });
}

// Render table based on filters
function renderTable(data) {
    const tableBody = document.getElementById("settlementsBody");
    tableBody.innerHTML = "";  // Clear table

    if (data.length === 0) {
        // Add a single row indicating no data
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = '<td colspan="5" class="text-center">No settlements found</td>';
        tableBody.appendChild(emptyRow);
        return;
    }

    data.forEach(s => {
        const row = document.createElement("tr");
        
        // Add status-based styling
        if (s.status === "Completed") {
            row.classList.add("table-success");
        } else if (s.status === "Pending") {
            row.classList.add("table-warning");
        }
        
        row.innerHTML = `
            <td>${s.groupID}</td>
            <td>${s.payerID}</td>
            <td>${s.receiverID}</td>
            <td>$${s.amount.toFixed(2)}</td>
            <td>${s.status}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Apply filters without sending a request to the backend
function filterSettlements() {
    const group = document.getElementById("groupFilter").value;
    const payer = document.getElementById("payerFilter").value;
    const receiver = document.getElementById("receiverFilter").value;

    const filtered = allSettlements.filter(s =>
        (group === "" || s.groupID == group) &&
        (payer === "" || s.payerID == payer) &&
        (receiver === "" || s.receiverID == receiver)
    );

    renderTable(filtered);
    showInfo(`Showing ${filtered.length} of ${allSettlements.length} settlements.`);
}