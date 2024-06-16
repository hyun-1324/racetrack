import { sessionData } from './classes.js';

const sessionInfo = document.getElementById('sessionInfo');
const noRaces = document.getElementById('noRaces');
const proceedMessage = document.getElementById('proceedMessage');
let sessionId = document.getElementById('sessionId').textContent;

let nextSessionData = new sessionData(0, ['', '', '', '', '', '', '', '']);

socket.on('next_session', data => {
  nextSessionData = data;
  if (nextSessionData.sessionId === 0) {
    sessionInfo.style.display = 'none';
    noRaces.style.display = 'block';
  } else if (
    !(nextSessionData.sessionId === 0) &&
    nextSessionData.sessionStatus === 'ready'
  ) {
    sessionInfo.style.display = 'block';
    proceedMessage.style.display = 'block';
    noRaces.style.display = 'none';
    sessionId = upcomingSessionData.sessionId;
  } else if (
    !(nextSessionData.sessionId === 0) &&
    nextSessionData.sessionStatus === 'start'
  ) {
    sessionInfo.style.display = 'block';
    proceedMessage.style.display = 'none';
    noRaces.style.display = 'none';
    sessionId = upcomingSessionData.sessionId;
  }
});
