import { sessionData } from '../classes.js';
import { fullscreenButton } from './timerAndFullScreen.js';

const sessionInfo = document.getElementById('sessionInfo');
const driverNames = document.getElementById('driverNames');
const fullscreenButtonElement = document.getElementById('fullScreenButton');
const noRaces = document.getElementById('noRaces');
const proceedMessage = document.getElementById('proceedMessage');
let sessionId = document.getElementById('sessionId');
let nextSessionData = new sessionData(0, undefined, [
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
]);

// Show next session info using fetched data
socket.on('next_session', data => {
  nextSessionData = data;
  if (nextSessionData.sessionId === 0) {
    sessionInfo.style.display = 'none';
    noRaces.style.display = 'block';
  } else if (
    !(nextSessionData.sessionId === 0) &&
    nextSessionData.status === 'endSession'
  ) {
    sessionInfo.style.display = 'block';
    driverNames.style.display = 'grid';
    proceedMessage.style.display = 'block';
    noRaces.style.display = 'none';
    sessionId.textContent = nextSessionData.sessionId;
    addDriversInfo(nextSessionData.driverNameList);
  } else if (
    !(nextSessionData.sessionId === 0) &&
    nextSessionData.status === 'start'
  ) {
    sessionInfo.style.display = 'block';
    driverNames.style.display = 'grid';
    proceedMessage.style.display = 'none';
    noRaces.style.display = 'none';
    sessionId.textContent = nextSessionData.sessionId;
    addDriversInfo(nextSessionData.driverNameList);
  } else if (
    !(nextSessionData.sessionId === 0) &&
    nextSessionData.status === 'prepare'
  ) {
    sessionInfo.style.display = 'block';
    driverNames.style.display = 'grid';
    proceedMessage.style.display = 'block';
    noRaces.style.display = 'none';
    sessionId.textContent = nextSessionData.sessionId;
    addDriversInfo(nextSessionData.driverNameList);
  }
});

// Add drivers' info using fetched data
function addDriversInfo(driverNameList) {
  document.querySelector('#driverNames').style.display = 'grid';
  for (let i = 0; i < 8; i++) {
    const driverName = document.getElementById(`car${[i + 1]}`);
    if (driverNameList[i] === '' || driverNameList[i] === null) {
      driverName.style.display = 'none';
    } else {
      driverName.style.display = 'block';
      driverName.textContent = `Car ${i + 1}: ` + driverNameList[i];
    }
  }
}

fullscreenButton(fullscreenButtonElement);
