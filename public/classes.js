// Class for data being sent via 'raceMode' socket event by safety official
// Options for mode: 'safe', 'hazard', 'danger', 'finish'
// Options for startRace and endSession: true/false
export class raceModeData {
    constructor(modeName, startRace, endSession) {
        this.mode = modeName
        this.startRace = startRace
        this.endSession = endSession;
}};

// Class for data being sent via 'lap' socket event by lap-line-observer
export class lapData {
    constructor(carNumber, lapTime) {
        this.carNumber = carNumber;
        this.lapTime = lapTime;
}};

// Class for data being sent via 'driverInfo' socket event by receptionist
// Action options: 'add', 'remove', 'edit'
export class driverInfoData {
    constructor(raceSession, action, carNumber, driverName) {
        this.raceSession = raceSession;
        this.action = action;
        this.carNumber = carNumber;
        this.driverName = driverName;
}}