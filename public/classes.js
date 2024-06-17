export class endTimeData {
  constructor(sessionId, endTime, action) {
    this.sessionId = sessionId;
    this.action = action;
    this.endTime = endTime;
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
  constructor(sessionId, action, driverNameList, sessionStatus) {
    this.sessionId = sessionId;
    this.action = action;
    this.driverNameList = driverNameList;
  }
}
