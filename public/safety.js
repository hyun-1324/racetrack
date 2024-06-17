import { endTimeData, sessionData } from './classes.js';

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
let sessionId = document.getElementById('sessionId').textContent;
let countdownFunction;
let endTime;
let endSessionStatus = true;
let upcomingSessionData = new sessionData(0, ['', '', '', '', '', '', '', '']);

start.addEventListener('click', startRace);
end.addEventListener('click', endSession);
safe.addEventListener('click', () => setMode('safe'));
hazard.addEventListener('click', () => setMode('hazard'));
danger.addEventListener('click', () => setMode('danger'));
finish.addEventListener('click', () => setMode('finish'));

async function startRace() {
  await timer();
  socket.emit('end_time', new endTimeData(sessionId, 'start', endTime));
  setMode('safe');
  toggleModeButtonsState();
  hideElements(start);
  showElements(modeButtons);
  endSessionStatus = false;
}

function endSession() {
  setMode('danger');
  hideElements(end);
  showElements(start);
  endSessionStatus = true;
  socket.emit('end_time', new endTimeData(sessionId, 'endSession'));

  if (
    upcomingSessionData.sessionId === 0 ||
    upcomingSessionData.sessionId === undefined
  ) {
    sessionId = 0;
    hideElements(sessionInfo);
    showElements(noRaces);
    start.disabled = true;
  } else {
    sessionId = upcomingSessionData.sessionId;
    for (let i = 1; i < 9; i++) {
      const name = document.getElementById(`car${i}`);
      name.textContent = upcomingSessionData.driverNameList[i - 1];
    }
    start.disabled = false;
  }
}

function setMode(mode) {
  socket.emit('race_mode', mode);
  setCurrentModeOnDisplay(mode);

  if (mode === 'finish') {
    socket.emit('end_time', new endTimeData(sessionId, 'finish'));
    clearInterval(countdownFunction);
    document.getElementById('timer').innerHTML = 'Race Completed!';
    toggleModeButtonsState();
    hideElements(modeButtons);
    showElements(end);
  }
}

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

function toggleModeButtonsState() {
  safe.disabled = !safe.disabled;
  hazard.disabled = !hazard.disabled;
  danger.disabled = !danger.disabled;
  finish.disabled = !finish.disabled;
}

function showElements(elements) {
  elements.style.display = 'block';
  if (!(elements === sessionInfo) && !(elements === noRaces)) {
    elements.disabled = !elements.disabled;
  }
}

function hideElements(elements) {
  elements.style.display = 'none';
  if (!(elements === sessionInfo) && !(elements === noRaces)) {
    elements.disabled = !elements.disabled;
  }
}

async function getTimerDuration() {
  try {
    const response = await fetch('/timer');
    const data = await response.json();
    return data.timerDuration;
  } catch (error) {
    console.error('Error fetching timer duration:', error);
  }
}

async function timer() {
  const timerDuration = await getTimerDuration();

  // Set the date and time we're counting down to
  endTime = new Date().getTime() + timerDuration * 1000; // set end time from now

  // Update the count down every 1 second
  countdownFunction = setInterval(function () {
    // Get today's date and time
    let now = new Date().getTime();

    // Find the distance between now and the count down date
    let distance = endTime - now;

    // Time calculations for hours, minutes and seconds

    let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((distance % (1000 * 60)) / 1000);
    let milliseconds = Math.floor((distance % 1000) / 10);

    // Display the result in the element with id="timer"
    document.getElementById('timer').innerHTML =
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

    if (distance < 0) {
      setMode('finish');
    }
  }, 10);
}

socket.on('upcoming_session', data => {
  upcomingSessionData = data;
  if (endSessionStatus && upcomingSessionData.sessionId === 0) {
    hideElements(sessionInfo);
    showElements(noRaces);
    start.disabled = true;
  } else if (endSessionStatus && !(upcomingSessionData.sessionId === 0)) {
    showElements(sessionInfo);
    hideElements(noRaces);
    sessionId = upcomingSessionData.sessionId;
    for (let i = 1; i < 9; i++) {
      const name = document.getElementById(`car${i}`);
      name.textContent = upcomingSessionData.driverNameList[i - 1];
    }
    start.disabled = false;
  }
});
