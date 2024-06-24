import {showTimer, fullscreenButton} from './countdown.js';

let currentRaceData
socket.on('upcoming_session', (data) => {
    currentRaceData = data;
});
socket.on('reconnect_leaderboard', (data) => {
    currentRaceData = data;
});

showTimer();
fullscreenButton();
flags();
createLeaderBoard();
updateLeaderboard();

function flags() {
    const flag = document.getElementById('flag');
    socket.on('race_mode', data => {
        if (data === 'safe') {
          flag.style.backgroundColor = 'green';
        } else if (data === 'hazard') {
            flag.style.backgroundColor = 'yellow';
        } else if (data === 'danger') {
            flag.style.backgroundColor = 'red';
            if (flag.classList.contains('checkered')) {
                flag.classList.remove('checkered');
            }
        } else if (data === 'finish') {
          flag.backgroundColor = '';
          flag.classList.add('checkered');
        }
      });
}

function createLeaderBoard() {
    const leaderBoard = document.getElementById('leaderBoard');
    const session = document.getElementById('sessionNumber');
    const message = document.getElementById('noSessionMessage');
    socket.on('end_time', (timeData) => {
        if (timeData.action === 'start' || leaderBoard.rows.length === 1 && currentRaceData.id !== 0) {
            session.textContent = currentRaceData.sessionId;
            message.style.display = 'none';
            leaderBoard.style.display = 'table';
            // Clear table rows from previous session
            while (leaderBoard.rows.length > 1) {
                leaderBoard.deleteRow(1);
            }
            // Create new table rows for each car in current session
            for (let i = 1; i < 9; i++) {
                if (currentRaceData.driverNameList[i - 1] !== '') {
                    const row = leaderBoard.insertRow();
                    const car = row.insertCell(0);
                    const driver = row.insertCell(1);
                    const lap = row.insertCell(2);
                    const time = row.insertCell(3);
                    car.textContent = i;
                    driver.textContent = currentRaceData.driverNameList[i - 1];
                    lap.textContent = 0;
                    time.textContent = '-';
                }
            }
        }
    });  
}

function updateLeaderboard() {
    const leaderBoard = document.getElementById('leaderBoard');
    socket.on('update_lap_time', (updatedLapTime) => {
        // find a row that has the matching car number in column 0
        const rowToUpdate = Array.from(leaderBoard.rows).find(row => row.cells[0].textContent === updatedLapTime.carNumber.toString());
        rowToUpdate.cells[2].textContent = updatedLapTime.currentLap;
        // Convert fastest lap time to mm:ss:ms or display '-' if no fastest lap time
        if (updatedLapTime.fastestLap === 0)  {
            rowToUpdate.cells[3].textContent = '-';
        } else {
            rowToUpdate.cells[3].textContent = msToTime(updatedLapTime.fastestLap);
        }

        // Update the leader board rows' order to show fastest lap times at the top
        if (updatedLapTime.fastestLap === 0) return;
        const tableRows = Array.from(leaderBoard.rows).slice(1);
        tableRows.sort((a, b) => {
            if (a.cells[3].textContent === '-') return 1;
            return TimeToMs(a.cells[3].textContent) - TimeToMs(b.cells[3].textContent);
        });
        // Remove all rows from the table
        while (leaderBoard.rows.length > 1) {
            leaderBoard.deleteRow(1);
        }
        // Add the sorted rows back to the table
        tableRows.forEach((row) => {
            leaderBoard.append(row);
        });
    });
}

function TimeToMs(time) {
    // Convert mm:ss:ms to milliseconds
    const timeArray = time.split(':');
    const minutes = parseInt(timeArray[0]) * 60 * 1000;
    const seconds = parseInt(timeArray[1]) * 1000;
    const milliseconds = parseInt(timeArray[2]);
    return minutes + seconds + milliseconds;
}

function msToTime(duration) {
    // Convert fastest lap time to mm:ss:ms
    let milliseconds = parseInt((duration % 1000) / 10),
        seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60);

    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    milliseconds = (milliseconds < 10) ? "0" + milliseconds : milliseconds;

    return minutes + ":" + seconds + ":" + milliseconds;
}
