import { sessionData } from '../classes.js';

document.getElementById('addSession').addEventListener('click', addSession);
document
  .getElementById('removeSession')
  .addEventListener('click', removeSessions);

let sessionIdCounter = 1;

function addSession() {
  const tableBody = document
    .getElementById('sessionsTable')
    .getElementsByTagName('tbody')[0];
  const newRow = tableBody.insertRow();
  socket.emit('update_session', new sessionData(sessionIdCounter, 'add'));

  const cellSelect = newRow.insertCell(0);
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  cellSelect.appendChild(checkbox);

  const cellSessionId = newRow.insertCell(1);
  cellSessionId.textContent = `${sessionIdCounter++}`;

  for (let i = 2; i <= 9; i++) {
    const cell = newRow.insertCell(i);
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = `Driver ${i - 1}`;
    input.maxLength = 30;
    cell.appendChild(input);
  }

  const cellActions = newRow.insertCell(10);
  const editButton = document.createElement('button');
  editButton.textContent = 'Save';
  editButton.addEventListener('click', () => editDrivers(newRow));
  cellActions.appendChild(editButton);
}

function editDrivers(row) {
  // We need to add code later to check if the session has already started.

  const inputs = row.getElementsByTagName('input');
  const driverNameList = [];

  for (let i = 2; i <= 9; i++) {
    const input = row.cells[i].getElementsByTagName('input')[0];
    driverNameList.push(input.value);
  }

  if (hasDuplicates(driverNameList)) {
    alert('Driver names are duplicated.');
    return;
  }

  for (const input of inputs) {
    if (input.type === 'text') {
      input.disabled = !input.disabled;
    }
  }

  if (
    Array.from(inputs).some(input => input.type === 'text' && input.disabled)
  ) {
    const sessionId = row.cells[1].textContent;

    const sessionInfoData = new sessionData(sessionId, 'edit', driverNameList);
    socket.emit('update_session', sessionInfoData);
  }

  const button = row.getElementsByTagName('button');
  if (button[0].innerHTML === 'Edit') {
    button[0].innerHTML = 'Save';
  } else if (button[0].innerHTML === 'Save') {
    button[0].innerHTML = 'Edit';
  }
}

function hasDuplicates(array) {
  let uniqueNameArray = [];
  for (let i = 0; i < 8; i++) {
    if (!(array[i] === '')) {
      uniqueNameArray.push(array[i]);
    }
  }
  const uniqueElements = new Set(uniqueNameArray);
  return uniqueElements.size !== uniqueNameArray.length;
}

function removeSessions() {
  const tableBody = document
    .getElementById('sessionsTable')
    .getElementsByTagName('tbody')[0];
  const rows = tableBody.getElementsByTagName('tr');
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    const checkbox = row.getElementsByTagName('input')[0];
    if (checkbox.checked) {
      socket.emit(
        'update_session',
        new sessionData(row.cells[1].textContent, 'remove')
      );
      tableBody.removeChild(row);
    }
  }
}

socket.on('end_time', data => {
  if ((data.action = 'start')) {
    const tableBody = document
      .getElementById('sessionsTable')
      .getElementsByTagName('tbody')[0];

    const rows = tableBody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
      if (Number(rows[i].cells[1].textContent) === Number(data.sessionId)) {
        tableBody.removeChild(rows[i]);
        break;
      }
    }
  }
});
