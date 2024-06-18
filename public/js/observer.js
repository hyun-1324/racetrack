import { lapTime } from '../classes.js';

setButtons();
hideButtons();

function setButtons() {
    socket.on('upcoming_session', (upcomingSessionData) => {
        const buttongrid = document.querySelector('#buttongrid');
        buttongrid.style.display = 'none';
        // Clear the buttons from the previous session
        const buttons = document.querySelectorAll('.carButton');
        buttons.forEach(button => button.remove());
        // Create buttons for each driver in the upcoming session
        for (let i = 1; i < 9; i ++) {
            if (upcomingSessionData.driverNameList[i-1] !== '') {
                const button = document.createElement('button');
                button.classList.add('carButton');
                button.innerText = i;
                button.addEventListener('click', () => {
                    let time = new Date().getTime();
                    socket.emit('lapData', new lapTime(i, time));
                });
                buttongrid.appendChild(button);
            };
        };
    });
}

function hideButtons() {
    const buttongrid = document.querySelector('#buttongrid');
    const sessionMessage = document.querySelector('#sessionMessage');
    socket.on('race_mode', (mode) => {
        if (mode === 'finish') {
            buttongrid.style.display = 'none';
            sessionMessage.style.display = 'block';

        } else if (mode === 'safe') {
            sessionMessage.style.display = 'none';
            buttongrid.style.display = 'grid';
        }  
    });
}

