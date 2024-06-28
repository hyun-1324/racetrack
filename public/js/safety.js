import { endTimeData, sessionData } from '../classes.js';

const start = document.getElementById('start');
const end = document.getElementById('end');
const safe = document.getElementById('safe');
const hazard = document.getElementById('hazard');
const danger = document.getElementById('danger');
const finish = document.getElementById('finish');
const currentMode = document.getElementById('currentMode');
const sessionInfo = document.getElementById('sessionInfo');
const noRaces = document.getElementById('noRaces');
const modeButtons = document.querySelector('.modeButtons');
let sessionId = 0;
let sessionIdEl = document.getElementById('sessionId');
let countdownFunction;
let endTime;
let timerDuration;
let endSessionStatus = true;
let upcomingSessionData = new sessionData(0, undefined, [
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
]);

start.addEventListener('click', startRace);
end.addEventListener('click', endSession);
safe.addEventListener('click', () => setMode('safe'));
hazard.addEventListener('click', () => setMode('hazard'));
danger.addEventListener('click', () => setMode('danger'));
finish.addEventListener('click', () => setMode('finish'));

// Define the startRace button functionality
async function startRace() {
  timerDuration = await getTimerDuration();
  endTime = new Date().getTime() + timerDuration * 1000;
  await timer(endTime);
  socket.emit('end_time', new endTimeData(sessionId, 'start', endTime));
  setMode('safe');
  activateModeButtons();
  hideElements(start);
  showElements(modeButtons);
  endSessionStatus = false;
}

// Define the endSession button functionality
async function endSession() {
  setMode('danger');
  hideElements(end);
  showElements(start);
  endSessionStatus = true;
  socket.emit('end_time', new endTimeData(sessionId, 'endSession', endTime));
  timerDuration = await getTimerDuration();
  if (Number(timerDuration) === 60) {
    document.getElementById('timer').textContent = '01:00:00';
  } else if (Number(timerDuration) === 600) {
    document.getElementById('timer').textContent = '10:00:00';
  }

  if (upcomingSessionData.driverNameList) {
    for (let i = 1; i < 9; i++) {
      const name = document.getElementById(`car${i}`);
      name.textContent = upcomingSessionData.driverNameList[i - 1];
    }
  }
}

// Set the race mode and update the display
function setMode(mode) {
  socket.emit('race_mode', mode);
  setCurrentModeOnDisplay(mode);

  // Stop the timer when the mode is 'finish'
  if (mode === 'finish') {
    endTime = new Date().getTime();
    socket.emit('end_time', new endTimeData(sessionId, 'finish', endTime));
    clearInterval(countdownFunction);
    document.getElementById('timer').textContent = 'Race Completed!';
    deactivateModeButtons();
    hideElements(modeButtons);
    showElements(end);
  }
}

// Update the display to show the current mode
function setCurrentModeOnDisplay(mode) {
  if (mode === 'safe') {
    currentMode.textContent = 'Safe';
    currentMode.style.backgroundColor = 'green';
  } else if (mode === 'hazard') {
    currentMode.textContent = 'Hazard';
    currentMode.style.backgroundColor = 'yellow';
  } else if (mode === 'danger') {
    currentMode.textContent = 'Danger';
    currentMode.style.backgroundColor = 'red';
  } else if (mode === 'finish') {
    currentMode.textContent = 'Finish';
    currentMode.style.backgroundColor = 'white';
  }
}

// Enable all mode buttons
function activateModeButtons() {
  safe.disabled = false;
  hazard.disabled = false;
  danger.disabled = false;
  finish.disabled = false;
}

// Disable all mode buttons
function deactivateModeButtons() {
  safe.disabled = true;
  hazard.disabled = true;
  danger.disabled = true;
  finish.disabled = true;
}

// Show specified elements
function showElements(elements) {
  elements.style.display = 'block';
  if (!(elements === sessionInfo) && !(elements === noRaces)) {
    elements.disabled = false;
  }
}

// Hide specified elements
function hideElements(elements) {
  elements.style.display = 'none';
  if (!(elements === sessionInfo) && !(elements === noRaces)) {
    elements.disabled = true;
  }
}

// Get the timer duration from the environment variable
async function getTimerDuration() {
  try {
    const response = await fetch('/timer');
    const data = await response.json();
    return data.timerDuration;
  } catch (error) {
    console.error('Error fetching timer duration:', error);
  }
}

// Set the timer using endTime
async function timer(endTime) {
  if (countdownFunction) clearInterval(countdownFunction);
  timerDuration = await getTimerDuration();

  // Update the count down every 10 milliseconds
  countdownFunction = setInterval(function () {
    // Get today's date and time
    let now = new Date().getTime();

    // Calculate the remaining time
    let distance = endTime - now;

    // Time calculations for minutes, seconds and milliseconds
    let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((distance % (1000 * 60)) / 1000);
    let milliseconds = Math.floor((distance % 1000) / 10);

    // Display the result in the element with id="timer"
    document.getElementById('timer').textContent =
      minutes.toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false,
      }) +
      ':' +
      seconds.toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false,
      }) +
      ':' +
      milliseconds.toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false,
      });

    // Set the mode to 'finish' if the timer has ended
    if (distance < 0) {
      setMode('finish');
    }
  }, 10);
}

// Show upcoming session info using upcoming session data
socket.on('upcoming_session', async data => {
  let now = new Date().getTime();
  upcomingSessionData = data;
  if (endSessionStatus && upcomingSessionData.sessionId === 0) {
    hideElements(sessionInfo);
    showElements(noRaces);
    start.disabled = true;
  } else if (
    upcomingSessionData.endTime - now > 0 &&
    upcomingSessionData.sessionId !== 0
  ) {
    showElements(sessionInfo);
    hideElements(noRaces);
    sessionId = upcomingSessionData.sessionId;
    sessionIdEl.textContent = sessionId;
    timer(upcomingSessionData.endTime);
    for (let i = 1; i < 9; i++) {
      const name = document.getElementById(`car${i}`);
      name.textContent = upcomingSessionData.driverNameList[i - 1];
    }
    activateModeButtons();
    hideElements(start);
    showElements(modeButtons);
    endSessionStatus = false;
    start.disabled = true;
  } else if (
    upcomingSessionData.endTime - now < 0 &&
    upcomingSessionData.sessionId !== 0 &&
    (upcomingSessionData.status === 'start' ||
      upcomingSessionData.status === 'finish')
  ) {
    sessionId = upcomingSessionData.sessionId;
    sessionIdEl.textContent = sessionId;
    document.getElementById('timer').innerHTML = 'Race Completed!';
    showElements(sessionInfo);
    showElements(end);
    hideElements(modeButtons);
    hideElements(noRaces);
    hideElements(start);
    endSessionStatus = false;
    start.disabled = true;

    for (let i = 1; i < 9; i++) {
      const name = document.getElementById(`car${i}`);
      name.textContent = upcomingSessionData.driverNameList[i - 1];
    }
  } else if (endSessionStatus && upcomingSessionData.sessionId !== 0) {
    timerDuration = await getTimerDuration();
    if (
      upcomingSessionData.status === 'prepare' ||
      upcomingSessionData.status === 'endSession'
    ) {
      if (Number(timerDuration) === 60) {
        document.getElementById('timer').innerHTML = '01:00:00';
      } else if (Number(timerDuration) === 600) {
        document.getElementById('timer').innerHTML = '10:00:00';
      }
    }
    showElements(sessionInfo);
    hideElements(noRaces);
    sessionId = upcomingSessionData.sessionId;
    sessionIdEl.textContent = sessionId;
    for (let i = 1; i < 9; i++) {
      const name = document.getElementById(`car${i}`);
      name.textContent = upcomingSessionData.driverNameList[i - 1];
    }
    if (
      upcomingSessionData.driverNameList.every(
        name => name === '' || name === null
      )
    ) {
      start.disabled = true;
    } else {
      start.disabled = false;
    }
  }
});

// Set race mode by using reconnect data
socket.on('reconnect_race_mode', mode => {
  socket.emit('race_mode', mode);
  setCurrentModeOnDisplay(mode);

  if (mode === 'finish') {
    document.getElementById('timer').textContent = 'Race Completed!';
    showElements(end);
    hideElements(start);
  }
});
