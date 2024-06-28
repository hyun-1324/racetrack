// Class for data being sent via 'end_time' socket event 
export class endTimeData {
  constructor(sessionId, action, endTime) {
    this.sessionId = sessionId;
    this.action = action; // 'start', 'endSession', 'finish' ('reset')
    this.endTime = endTime;
  }
}

// Class for data being sent via 'racemode' and 'racemode_reconnect' socket events 
export class racemodeData {
  constructor(mode) {
    this.mode = mode; // 'safe', 'hazard', 'danger', 'finish'
  }
}

// Class for data being sent via 'lap_data' socket event by lap-line-observer
export class lapTime {
  constructor(sessionId, carNumber, laplineCrossed) {
    this.sessionId = sessionId;
    this.carNumber = carNumber;
    this.laplineCrossed = laplineCrossed;
  }
}

// Class for data being sent to leader board via 'update_lap_time' socket event when lap-times are updated
export class lapTimeUpdate {
  constructor(sessionId, carNumber, currentLap, fastestLapTime) {
    this.sessionId = sessionId;
    this.carNumber = carNumber;
    this.currentLap = currentLap;
    this.fastestLap = fastestLapTime; // in milliseconds
  }
}

// Class for data being sent via 'next_session', 'upcoming_session', 'reconnect_reception' and 'update_session' socket events
export class sessionData {
  constructor(sessionId, status, driverNameList) {
    this.sessionId = sessionId;
    this.status = status; //'finish', start', 'prepare', 'endSession' ('add', 'edit', 'remove')
    this.driverNameList = driverNameList;
  }
}
