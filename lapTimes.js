import {lapTimeUpdate} from './public/classes.js';

export async function updateLapTime(db, lapTime) {
    // Add safety checks to ensure that the lapTime is valid (sessionId is correct, car num is valid for session, lapTime > 0, etc.)?
 
// Update the lap time in the database
    // Get the lap_times object for the car in this session from the database
    const sql1 = `SELECT * FROM lap_times WHERE session_id = ? AND car_num = ?;`;
    const lapTimeData = await db.get(sql1, [lapTime.sessionId, lapTime.carNumber]);
    // If it doesn't exist, insert the new lap_times object to database for the car in this session
    if (!lapTimeData) {
        const sqlInsert = `INSERT INTO lap_times (session_id, car_num, lap_num, lap_started, fastest_lap) VALUES (?, ?, ?, ?, ?);`;
        await db.run(sqlInsert, [lapTime.sessionId, lapTime.carNumber, 1, lapTime.laplineCrossed, 0]);
        return new lapTimeUpdate(lapTime.sessionId, lapTime.carNumber, 1, 0);
    } else {
        // If it does exist, update the lap number and fastest lap time 
        // Calculate fastest lap time
        const oldLapTime = lapTimeData.fastest_lap;
        let fastestLapTime 
        if (oldLapTime === 0) {
            fastestLapTime = (lapTime.laplineCrossed - lapTimeData.lap_started);
        } else {
            fastestLapTime = Math.min(oldLapTime, (lapTime.laplineCrossed - lapTimeData.lap_started));
        }
        const sql2 = `UPDATE lap_times SET lap_num = ?, lap_started = ?, fastest_lap = ? WHERE session_id = ? AND car_num = ?;`;
        await db.run(sql2, [lapTimeData.lap_num + 1, lapTime.laplineCrossed, fastestLapTime, lapTime.sessionId, lapTime.carNumber]);
        return new lapTimeUpdate(lapTime.sessionId, lapTime.carNumber, lapTimeData.lap_num + 1, fastestLapTime);
    }

}