document.addEventListener("DOMContentLoaded", () => {
  const loadButton = document.getElementById("load-users");
  const filterInput = document.getElementById("filter-input");
  const statusPara = document.getElementById("status");
  const usersList = document.getElementById("users-list");

  let loadedUsers = [];

  async function fetchUsers() {
    loadButton.disabled = true;
    statusPara.textContent = "Loading users...";
    usersList.innerHTML = "";

    try {
      const response = await fetch("https://jsonplaceholder.typicode.com/users");

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      loadedUsers = await response.json();
      statusPara.textContent = `Successfully loaded ${loadedUsers.length} users.`;
      renderUsers(loadedUsers);
    } catch (error) {
      statusPara.textContent = `Error loading users: ${error.message}`;
    } finally {
      loadButton.disabled = false;
    }
  }

  function renderUsers(users) {
    usersList.innerHTML = "";

    users.forEach((user) => {
      const li = document.createElement("li");

      const nameHeading = document.createElement("strong");
      nameHeading.textContent = user.name;

      const details = document.createElement("span");
      details.textContent = ` — ${user.email} | ${user.address?.city || "N/A"} | ${user.company?.name || "N/A"}`;

      li.appendChild(nameHeading);
      li.appendChild(details);
      usersList.appendChild(li);
    });
  }

  function handleFilter() {
    const searchTerm = filterInput.value.toLowerCase();
    const filtered = loadedUsers.filter((user) =>
      user.name.toLowerCase().includes(searchTerm)
    );
    renderUsers(filtered);
  }

  loadButton.addEventListener("click", fetchUsers);
  filterInput.addEventListener("input", handleFilter);
});