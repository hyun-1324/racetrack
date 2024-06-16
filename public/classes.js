export class endTimeData {
  constructor(sessionId, endTime, sessionStatus) {
    this.sessionId = sessionId;
    this.endTime = endTime;
    this.sessionStatus = sessionStatus;
  }
}

// Class for data being sent via 'lap' socket event by lap-line-observer
export class lapTime {
  constructor(sessionId, carNumber, lapRound, fastestLapTime) {
    this.sessionId = sessionId;
    this.carNumber = carNumber;
    this.lapRound = lapRound;
    this.fastestlapTime = fastestLapTime;
  }
}

// Class for data being sent via 'driverInfo' socket event by receptionist
// Action options: 'add', 'remove', 'edit'
export class sessionData {
  constructor(sessionId, driverNameList, sessionStatus) {
    this.sessionId = sessionId;
    this.driverNameList = driverNameList;
    this.sessionStatus = sessionStatus;
  }
}
