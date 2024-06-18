export class endTimeData {
  constructor(sessionId, action, endTime) {
    this.sessionId = sessionId;
    this.action = action;
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
  constructor(carNumber, laplineCrossed) {
    this.carNumber = carNumber;
    this.laplineCrossed = laplineCrossed;
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
