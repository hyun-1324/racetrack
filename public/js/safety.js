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

function endSession() {
  setMode('danger');
  hideElements(end);
  showElements(start);
  endSessionStatus = true;
  socket.emit('end_time', new endTimeData(sessionId, 'endSession', endTime));
  if (Number(timerDuration) === 60) {
    document.getElementById('timer').innerHTML = '01:00:00';
  } else if (Number(timerDuration) === 600) {
    document.getElementById('timer').innerHTML = '10:00:00';
  }

  for (let i = 1; i < 9; i++) {
    const name = document.getElementById(`car${i}`);
    name.textContent = upcomingSessionData.driverNameList[i - 1];
  }
}

function setMode(mode) {
  socket.emit('race_mode', mode);
  setCurrentModeOnDisplay(mode);

  if (mode === 'finish') {
    endTime = new Date().getTime();
    socket.emit('end_time', new endTimeData(sessionId, 'finish', endTime));
    clearInterval(countdownFunction);
    document.getElementById('timer').innerHTML = 'Race Completed!';
    deactivateModeButtons();
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

function activateModeButtons() {
  safe.disabled = false;
  hazard.disabled = false;
  danger.disabled = false;
  finish.disabled = false;
}

function deactivateModeButtons() {
  safe.disabled = true;
  hazard.disabled = true;
  danger.disabled = true;
  finish.disabled = true;
}

function showElements(elements) {
  elements.style.display = 'block';
  if (!(elements === sessionInfo) && !(elements === noRaces)) {
    elements.disabled = false;
  }
}

function hideElements(elements) {
  elements.style.display = 'none';
  if (!(elements === sessionInfo) && !(elements === noRaces)) {
    elements.disabled = true;
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

async function timer(endTime) {
  if (countdownFunction) clearInterval(countdownFunction);
  timerDuration = await getTimerDuration();

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

socket.on('reconnect_race_mode', mode => {
  socket.emit('race_mode', mode);
  setCurrentModeOnDisplay(mode);

  if (mode === 'finish') {
    document.getElementById('timer').innerHTML = 'Race Completed!';
    showElements(end);
    hideElements(start);
  }
});
