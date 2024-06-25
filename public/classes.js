export class endTimeData {
  constructor(sessionId, action, endTime) {
    this.sessionId = sessionId;
    this.action = action; // 'start', 'endSession', 'finish, 'reset''
    this.endTime = endTime;
  }
}

// Class for data being sent via 'racemode' socket event by security official
// Mode options: 'safe', 'hazard', 'danger', 'finish'
export class racemodeData {
  constructor(mode) {
    this.mode = mode;
  }
}

// Class for data being sent via 'lap' socket event by lap-line-observer
export class lapTime {
  constructor(sessionId, carNumber, laplineCrossed) {
    this.sessionId = sessionId;
    this.carNumber = carNumber;
    this.laplineCrossed = laplineCrossed;
  }
}

// Class for data being sent to leader board via 'update_lap_time' socket event when lap-times are updated by observer
export class lapTimeUpdate {
  constructor(sessionId, carNumber, currentLap, fastestLapTime) {
    this.sessionId = sessionId;
    this.carNumber = carNumber;
    this.currentLap = currentLap;
    this.fastestLap = fastestLapTime; // in milliseconds
  }
}

// Class for data being sent via 'next_session' and 'upcoming_session' socket event
export class sessionData {
  constructor(sessionId, status, driverNameList) {
    this.sessionId = sessionId;
    this.status = status; //'finish', start', 'prepare', 'endSession'
    this.driverNameList = driverNameList;
  }
}
