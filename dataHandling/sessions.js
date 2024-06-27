import { sessionData, endTimeData } from '../public/classes.js';

export async function updateSessionInfo(db, updatedSession) {
    try {
      if (updatedSession.status === 'add') {
        const sqlSessions = `REPLACE INTO sessions (id, status) VALUES (?, 'prepare');`;
        await db.run(sqlSessions, [updatedSession.sessionId]);
  
        const sqlAssignments =
          'INSERT INTO driver_car_assignments (session_id, car_num) VALUES (?, ?)';
        for (let i = 1; i < 9; i++) {
          await db.run(sqlAssignments, [updatedSession.sessionId, i]);
        }
      } else if (updatedSession.status === 'remove') {
        const sql = 'DELETE FROM sessions WHERE id = ?';
        await db.run(sql, [updatedSession.sessionId]);
      } else if (updatedSession.status === 'edit') {
        const sql =
          'UPDATE driver_car_assignments SET driver_name = ? WHERE session_id = ? AND car_num = ?';
        for (let i = 0; i < 8; i++) {
          let driverName = updatedSession.driverNameList[i];
          await db.run(sql, [driverName, updatedSession.sessionId, i + 1]);
        }
      }
    } catch (err) {
      console.error(err.message);
      throw err;
    }
  }
  
export async function updateSessionStatus(db, endTime) {
    try {
        const sql = 'UPDATE sessions SET end_time = ?, status = ? WHERE id = ?';
        await db.run(sql, [endTime.endTime, endTime.action, endTime.sessionId]);
    } catch (err) {
        console.error(err.message);
        throw err;
    }
  }
  
export async function fetchNextSessionDataFromEndTime(db, endTime) {
    const nextSessionData = new sessionData();
    try {
      const findSessionSql =
        'SELECT MIN(id) AS nextSessionId FROM sessions WHERE id > ?';
      const result = await db.get(findSessionSql, endTime.sessionId);
  
      if (!result || !result.nextSessionId) {
        nextSessionData.sessionId = 0;
        return nextSessionData;
      }
  
      nextSessionData.sessionId = result.nextSessionId;
  
      const driverInfo = await db.all(
        'SELECT car_num, driver_name FROM driver_car_assignments WHERE session_id = ?',
        result.nextSessionId
      );
      nextSessionData.driverNameList = driverInfo.map(row => row.driver_name);
  
      if (endTime.action === 'start') {
        nextSessionData.status = 'start';
      } else {
        nextSessionData.status = 'endSession';
      }
  
      return nextSessionData;
    } catch (err) {
      console.error(err.message);
      throw err;
    }
  }
  
export async function fetchUpcomingSessionDataFromUpdate(db) {
    try {
      const upcomingSessionData = new sessionData();
      let row = await db.get(
        "SELECT id AS upcomingSessionId FROM sessions WHERE status = 'start'"
      );
      upcomingSessionData.status = 'start';
      if (!row || !row.upcomingSessionId) {
        row = await db.get(
          "SELECT id AS upcomingSessionId FROM sessions WHERE status = 'finish'"
        );
        upcomingSessionData.status = 'finish';
        if (!row || !row.upcomingSessionId) {
          row = await db.get(
            "SELECT MIN(id) AS upcomingSessionId FROM sessions WHERE status = 'prepare'"
          );
          upcomingSessionData.status = 'prepare';
          if (!row || !row.upcomingSessionId) {
            row = await db.get(
              "SELECT MAX(id) AS upcomingSessionId FROM sessions WHERE status = 'endSession'"
            );
            upcomingSessionData.status = 'endSession';
            upcomingSessionData.sessionId = 0;
            return upcomingSessionData;
          }
        }
      }
      upcomingSessionData.sessionId = row.upcomingSessionId;
  
      let sessionInfo = await db.get(
        'SELECT end_time AS endTime FROM sessions WHERE id = ?',
        [upcomingSessionData.sessionId]
      );
      if (sessionInfo.endTime) {
        upcomingSessionData.endTime = sessionInfo.endTime;
      }
  
      const driverInfo = await db.all(
        'SELECT car_num, driver_name FROM driver_car_assignments WHERE session_id = ?',
        [row.upcomingSessionId]
      );
      upcomingSessionData.driverNameList = driverInfo.map(r => r.driver_name);
      return upcomingSessionData;
    } catch (err) {
      console.error(err.message);
      throw err;
    }
  }
  
export async function fetchNextSessionData(db) {
    try {
        const nextSessionData = new sessionData();
        let result = await db.get(
          "SELECT id FROM sessions WHERE status IN ('start', 'finish')"
        );
      
        if (result && result.id) {
          result = await db.get(
            "SELECT MIN(id) AS id FROM sessions WHERE status = 'prepare'"
          );
      
          if (result && result.id) {
            nextSessionData.sessionId = result.id;
            nextSessionData.status = 'start';
          } else {
            nextSessionData.sessionId = 0;
          }
        } else {
          result = await db.get(
            "SELECT MAX(id) AS id FROM sessions WHERE status = 'endSession'"
          );
          if (result && result.id) {
            result = await db.get(
              "SELECT MIN(id) AS id FROM sessions WHERE status = 'prepare'"
            );
      
            if (result && result.id) {
              nextSessionData.sessionId = result.id;
              nextSessionData.status = 'prepare';
            } else {
              nextSessionData.sessionId = 0;
            }
          } else {
            result = await db.get(
              "SELECT MIN(id) AS id FROM sessions WHERE status = 'prepare'"
            );
            if (result && result.id) {
              nextSessionData.status = 'prepare';
              nextSessionData.sessionId = result.id;
            } else {
              nextSessionData.sessionId = 0;
            }
          }
        }
      
        const driverInfo = await db.all(
          'SELECT car_num, driver_name FROM driver_car_assignments WHERE session_id = ?',
          [nextSessionData.sessionId]
        );
        nextSessionData.driverNameList = driverInfo.map(r => r.driver_name);
      
        return nextSessionData;
    } catch (err) {
        console.error(err.message);
        throw err;
    }
  }
  
export async function fetchReconnectDataforReception(db) {
    try {
      const sessionArr = [];
      const sessionIdsInPreparing = await db.all(
        "SELECT id FROM sessions WHERE status = 'prepare' ORDER BY id ASC"
      );
  
      if (sessionIdsInPreparing.length === 0) {
        return sessionArr;
      }
  
      for (const session of sessionIdsInPreparing) {
        const sessionDataInPreparing = new sessionData();
        sessionDataInPreparing.status = 'prepare';
        sessionDataInPreparing.id = session.id;
  
        const driverInfo = await db.all(
          'SELECT car_num, driver_name FROM driver_car_assignments WHERE session_id = ?',
          [session.id]
        );
        sessionDataInPreparing.driverNameList = driverInfo.map(
          r => r.driver_name
        );
        sessionArr.push(sessionDataInPreparing);
      }
  
      return sessionArr;
    } catch (err) {
      console.error(err.message);
      throw err;
    }
  }
  
export async function fetchLastId(db) {
    let lastId;
    try {
        const result = await db.get('SELECT MAX(id) AS id FROM sessions');
  
        if (!result || !result.id) {
          lastId = 0;
          return lastId;
        }
      
        return result.id;
    } catch (err) {
        console.error(err.message);
        throw err;
    }
  }

export async function saveRaceMode(db, raceMode) {
    try {
      const sql = `UPDATE race_mode SET mode = ? WHERE id = 1`;
      await db.run(sql, [raceMode]);
    } catch (err) {
      console.error(err.message);
      throw err;
    }
  }
  
export async function fetchRaceMode(db) {
    try {
        const result = await db.get(
        'SELECT mode AS raceMode FROM race_mode WHERE id = 1'
        );
        return result.raceMode;
    } catch (err) {
        console.error(err.message);
        throw err;
    }
  }
  
export async function fetchEndTimeDataFromDb(db) {
    const endTime = new endTimeData();
    try {
        let result = await db.get(
        "SELECT end_time AS endTime, id FROM sessions WHERE status = 'start'"
        );
    
        if (result && result.endTime) {
        endTime.action = 'start';
        endTime.sessionId = result.id;
        endTime.endTime = result.endTime;
        return endTime;
        }
    
        if (!result || !result.endTime) {
            result = await db.get(
                "SELECT end_time AS endTime, id FROM sessions WHERE status = 'finish'"
            );
        
            if (result && result.endTime) {
                endTime.action = 'finish';
                endTime.sessionId = result.id;
                endTime.endTime = result.endTime;
                return endTime;
            }
        
            if (!result || !result.endTime) {
                result = await db.get(
                "SELECT end_time AS endTime FROM sessions WHERE status IN ('endSession', 'prepare')"
                );
                endTime.action = 'endSession';
                return endTime;
            }
        }
    } catch (err) {
        console.error(err.message);
        throw err;
    }
  }