const API_URL = "http://localhost:8000";

async function fetchExpenses() {
    const response = await fetch(`${API_URL}/expenses`);
    const expenses = await response.json();
    const expenseList = document.getElementById("expenseList");
    expenseList.innerHTML = "";
    expenses.forEach(exp => {
        expenseList.innerHTML += `<li>${exp.amount} - ${exp.category}</li>`;
    });
}

async function addExpense() {
    const amount = document.getElementById("amount").value;
    const category = document.getElementById("category").value;

    const response = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({amount, category})
    });

    if (response.ok) {
        alert("Expense added!");
        fetchExpenses();
    } else {
        alert("Failed to add expense.");
    }
}
