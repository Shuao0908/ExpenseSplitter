// {
//     "URL": "http://expense-splitter-app.azurewebsites.net",
//     "appserviceplan": "sab1e22_asp_7158",
//     "location": "canadacentral",
//     "name": "expense-splitter-app",
//     "os": "Linux",
//     "resourcegroup": "ExpenseSplitterRG",
//     "runtime_version": "PYTHON|3.10",
//     "runtime_version_detected": "-",
//     "sku": "FREE",
//     "src_path": "C:\\Users\\BehShuAo\\Downloads\\COMP3207_CW"
//   }
const API_URL = "http://localhost:8000";

// async function fetchExpenses() {
//     const response = await fetch(`${API_URL}/expenses`);
//     const expenses = await response.json();
//     const expenseList = document.getElementById("expenseList");
//     expenseList.innerHTML = "";
//     expenses.forEach(exp => {
//         expenseList.innerHTML += `<li>${exp.amount} - ${exp.category}</li>`;
//     });
// }

// async function addExpense() {
//     const amount = document.getElementById("amount").value;
//     const category = document.getElementById("category").value;

//     const response = await fetch(`${API_URL}/expenses`, {
//         method: "POST",
//         headers: {"Content-Type": "application/json"},
//         body: JSON.stringify({amount, category})
//     });

//     if (response.ok) {
//         alert("Expense added!");
//         fetchExpenses();
//     } else {
//         alert("Failed to add expense.");
//     }
// }
