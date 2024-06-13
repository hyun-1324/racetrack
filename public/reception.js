let sessionIdCounter = 1;

function addSession() {
  const tableBody = document
    .getElementById("sessionsTable")
    .getElementsByTagName("tbody")[0];
  const newRow = tableBody.insertRow();
  const data = { sessionId: sessionIdCounter };
  socket.emit("add_session", data);
  console.log(data);

  const cellSelect = newRow.insertCell(0);
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  cellSelect.appendChild(checkbox);

  const cellSessionId = newRow.insertCell(1);
  cellSessionId.textContent = `${sessionIdCounter++}`;

  for (let i = 2; i <= 9; i++) {
    const cell = newRow.insertCell(i);
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Driver ${i - 1}`;
    cell.appendChild(input);
  }

  const cellActions = newRow.insertCell(10);
  const editButton = document.createElement("button");
  editButton.textContent = "Edit";
  editButton.onclick = () => editDrivers(newRow);
  cellActions.appendChild(editButton);
}

function editDrivers(row) {
  // We need to add code later to check if the session has already started.

  const inputs = row.getElementsByTagName("input");
  for (const input of inputs) {
    if (input.type === "text") {
      input.disabled = !input.disabled;
    }
  }

  if (
    Array.from(inputs).some((input) => input.type === "text" && input.disabled)
  ) {
    const sessionId = row.cells[1].textContent;
    const sessionData = { sessionId: sessionId };
    for (let i = 2; i <= 9; i++) {
      const input = row.cells[i].getElementsByTagName("input")[0];
      sessionData[`driver${i - 1}`] = input.value;
    }

    console.log(sessionData);

    socket.emit("update_session_data", sessionData);
  }
}

function removeSessions() {
  const tableBody = document
    .getElementById("sessionsTable")
    .getElementsByTagName("tbody")[0];
  const rows = tableBody.getElementsByTagName("tr");
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    const checkbox = row.getElementsByTagName("input")[0];
    if (checkbox.checked) {
      const data = { sessionId: row.cells[1].textContent };
      socket.emit("remove_session", data);
      tableBody.removeChild(row);
    }
  }
}

socket.on("session_begins", (data) => {
  const tableBody = document
    .getElementById("sessionsTable")
    .getElementsByTagName("tbody")[0];

  const rows = tableBody.getElementsByTagName("tr");

  for (let i = 0; i < rows.length; i++) {
    if (rows[i].cells[1].textContent === data.sessionId) {
      tableBody.removeChild(rows[i]);
      break;
    }
  }
});
