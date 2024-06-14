import { raceModeData } from './classes.js';

const start = document.getElementById('start');
const end = document.getElementById('end');
const safe = document.getElementById('safe');
const hazard = document.getElementById('hazard');
const danger = document.getElementById('danger');
const finish = document.getElementById('finish');

function startRace() {
  start.disabled = !start.disabled;
  end.disabled = !end.disabled;
  safe.disabled = !safe.disabled;
  hazard.disabled = !hazard.disabled;
  danger.disabled = !danger.disabled;
  finish.disabled = !finish.disabled;
  timer();
}

function endSession() {
  start.disabled = !start.disabled;
  end.disabled = !end.disabled;
  safe.disabled = !safe.disabled;
  hazard.disabled = !hazard.disabled;
  danger.disabled = !danger.disabled;
  finish.disabled = !finish.disabled;
}

function safeMode() {}

function sendData(modeName, startRace, endSession) {
  socket.emit('racemode', new raceModeData(modeName, startRace, endSession));
}

function timer() {
  // Set the date and time we're counting down to
  let countDownDate = new Date().getTime() + 60 * 1000; // 1 min from now

  // Update the count down every 1 second
  let countdownFunction = setInterval(function () {
    // Get today's date and time
    let now = new Date().getTime();

    // Find the distance between now and the count down date
    let distance = countDownDate - now;

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
      clearInterval(countdownFunction);
      document.getElementById('timer').innerHTML = 'Game ended';
    }
  }, 10);
}

window.startRace = startRace;
window.endSession = endSession;

// function createButton() {
//     const button = document.createElement('button');
//     button.innerText = 'Safe';
//     document.body.append(button);
//     button.addEventListener('click', () => sendData('safe', true, false));
//   }

// createButton();
