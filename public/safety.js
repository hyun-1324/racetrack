import { endTimeData, sessionData } from './classes.js';

const start = document.getElementById('start');
const end = document.getElementById('end');
const safe = document.getElementById('safe');
const hazard = document.getElementById('hazard');
const danger = document.getElementById('danger');
const finish = document.getElementById('finish');
const sessionInfo = document.getElementById('sessionInfo');
const modeButtons = document.querySelector('.modeButtons');
let sessionId = document.getElementById('sessionId').textContent;
let countdownFunction;
let endTime;
let endSessionStatus = true;
let upcomingSessionData = new sessionData(0, ['', '', '', '', '', '', '', '']);

function startRace() {
  timer();
  socket.emit('end_time', new endTimeData(sessionId, endTime));
  socket.emit('racemode', 'safe');
  toggleModeButtonsState();
  hideElements(start);
  showElements(modeButtons);
  endSessionStatus = false;
}

function endSession() {
  socket.emit('racemode', 'danger');
  hideElements(end);
  showElements(start);
  endSessionStatus = true;

  if (upcomingSessionData.sessionId === 0) {
    sessionId = 0;
    start.disabled = !start.disabled;
  } else {
    sessionId = upcomingSessionData.sessionId;
    for (let i = 1; i < 9; i++) {
      const name = document.getElementById(`car${i}`);
      name.textContent = upcomingSessionData.driverNameList[i - 1];
    }
  }
}

function setMode(mode) {
  socket.emit('racemode', mode);

  if (mode === 'finish') {
    let now = new Date().getTime();
    socket.emit('end_time', new endTimeData(sessionId, now));
    clearInterval(countdownFunction);
    document.getElementById('timer').innerHTML = 'Game ended';
    toggleModeButtonsState();
    hideElements(modeButtons);
    showElements(end);
  }
}

function toggleModeButtonsState() {
  safe.disabled = !safe.disabled;
  hazard.disabled = !hazard.disabled;
  danger.disabled = !danger.disabled;
  finish.disabled = !finish.disabled;
}

function showElements(elements) {
  elements.style.display = 'inline';
  if (!(elements === sessionInfo)) {
    elements.disabled = !elements.disabled;
  }
}

function hideElements(elements) {
  elements.style.display = 'none';
  if (!(elements === sessionInfo)) {
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

    // If the count down is over, write some text
    if (distance < 0) {
      finishMode();
    }
  }, 10);
}

socket.on('upcoming_session', data => {
  upcomingSessionData = data;
  if (endSessionStatus && upcomingSessionData.sessionId === 0) {
    hideElements(sessionInfo);
    start.disabled = !start.disabled;
  } else if (endSessionStatus && !(upcomingSessionData.sessionId === 0)) {
    showElements(sessionInfo);
    start.disabled = !start.disabled;
  }
});

window.startRace = startRace;
window.endSession = endSession;
window.setMode = setMode;
