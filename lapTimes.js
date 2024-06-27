import {lapTimeUpdate, sessionData} from './public/classes.js';

// Update the lap time data in the database when a car crosses the lap line
// Return lapTimeUpdate object with updated lap number and fastest lap time to be emitted to the clients
export async function updateLapTime(db, lapTime) { 
    // Get the lap_times object for the car in this session from the database
    const sql1 = `SELECT * FROM lap_times WHERE session_id = ? AND car_num = ?;`;
    const lapTimeData = await db.get(sql1, [lapTime.sessionId, lapTime.carNumber]);
    // If it doesn't exist, insert new lap_times instance to database for the car in this session
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

// Fetch the session data (drivers and car numbers) from the database to display on the leaderboard
// Return a sessionData object to be emitted to clients during connection
// This function is used when the previous race has eneded and new race has not yet started
export async function fetchLeaderboardDataFromDb(db, upcomingSessionData) {
    if (
      upcomingSessionData.status === 'prepare' ||
      upcomingSessionData.status === 'endSession'
    ) {
      try {
        const latestSession = await db.get(
          'SELECT MAX(id) AS id FROM sessions WHERE status = "endSession"'
        );
        if (!latestSession || !latestSession.id) {
          return new sessionData(0);
        }
        const driverInfo = await db.all(
          'SELECT car_num, driver_name FROM driver_car_assignments WHERE session_id = ?',
          [latestSession.id]
        );
        return new sessionData(latestSession.id, 'endSession', driverInfo.map(r => r.driver_name)
        );
      } catch (err) {
        console.error(err.message);
        throw err;
      }
    }
  }
  
  // Fetch the lap time data from database using session id
  // Return an array of lapTimeUpdate objects to be emitted to the clients during connection
  export async function fetchLapTimeDataFromDb(db, upcomingSessionInfo) {
    try {
      const lapTimeDatas = [];
      const lapTimeData = await db.all(
        'SELECT session_id, car_num, lap_num, fastest_lap FROM lap_times WHERE session_id = ?',
        [upcomingSessionInfo.sessionId]
      );
  
      if (!lapTimeData) {
        return lapTimeDatas;
      }
  
      for (const row of lapTimeData) {
        let laptime = new lapTimeUpdate(
          row.session_id,
          row.car_num,
          row.lap_num,
          row.fastest_lap
        );
        lapTimeDatas.push(laptime);
      }
      return lapTimeDatas;
    } catch (err) {
      console.error(err.message);
      throw err;
    }
  }