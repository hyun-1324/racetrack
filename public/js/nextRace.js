import { sessionData } from '../classes.js';

const sessionInfo = document.getElementById('sessionInfo');
const driverNames = document.getElementById('driverNames');
const noRaces = document.getElementById('noRaces');
const proceedMessage = document.getElementById('proceedMessage');
const fullscreenButton = document.getElementById('fullScreenButton');
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

fullscreenButton.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    // Request full screen mode
    document.documentElement
      .requestFullscreen()
      .then(() => {
        fullscreen.textContent = 'Exit Full Screen';
      })
      .catch(err => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
        );
      });
  } else {
    // Exit full screen mode
    if (document.exitFullscreen) {
      document
        .exitFullscreen()
        .then(() => {
          fullscreen.textContent = 'Full Screen';
        })
        .catch(err => {
          console.error(
            `Error attempting to exit full-screen mode: ${err.message} (${err.name})`
          );
        });
    }
  }
});

document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) {
    fullscreenButton.textContent = 'Exit Full Screen';
  } else {
    fullscreenButton.textContent = 'Full Screen';
  }
});
