const loadBtn = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const statusEl = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

// Store all fetched users locally for fast filtering without new requests
let allUsers = [];

// Async function to fetch users with error handling and loading states
async function loadUsers() {
    loadBtn.disabled = true;
    statusEl.textContent = "Loading users...";
    usersList.textContent = "";

    try {
        const response = await fetch("https://jsonplaceholder.typicode.com/users");

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        allUsers = await response.json();
        statusEl.textContent = `Successfully loaded ${allUsers.length} users.`;
        renderUsers(allUsers);

    } catch (error) {
        statusEl.textContent = `Failed to load users: ${error.message}`;
    } finally {
        loadBtn.disabled = false;
    }
}

// Render any array of users securely using createElement and textContent
function renderUsers(usersToDisplay) {
    usersList.textContent = "";

    if (usersToDisplay.length === 0 && allUsers.length > 0) {
        const li = document.createElement("li");
        li.textContent = "No users match your filter.";
        li.style.padding = "1rem";
        li.style.textAlign = "center";
        li.style.color = "#64748b";
        usersList.appendChild(li);
        return;
    }

    usersToDisplay.forEach(user => {
        const li = document.createElement("li");
        li.className = "user-card";

        const nameH3 = document.createElement("h3");
        nameH3.textContent = user.name;

        const emailP = document.createElement("p");
        emailP.textContent = `Email: ${user.email}`;

        const cityP = document.createElement("p");
        cityP.textContent = `City: ${user.address.city}`;

        const companyP = document.createElement("p");
        companyP.textContent = `Company: ${user.company.name}`;

        li.appendChild(nameH3);
        li.appendChild(emailP);
        li.appendChild(cityP);
        li.appendChild(companyP);

        usersList.appendChild(li);
    });
}

// Filter stored array on input event (case-insensitive)
function handleFilter() {
    const query = filterInput.value.trim().toLowerCase();

    if (!query) {
        renderUsers(allUsers);
        return;
    }

    const filtered = allUsers.filter(user =>
        user.name.toLowerCase().includes(query)
    );

    renderUsers(filtered);
}

// Event Listeners
loadBtn.addEventListener("click", loadUsers);
filterInput.addEventListener("input", handleFilter);
