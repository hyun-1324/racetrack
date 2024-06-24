// Import necessary modules
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { checkAccessKeysExist, checkAccess } from './accessKey.js';
import { initializeDb } from './database/initializeDb.js';
import { sessionData, endTimeData, lapTimeUpdate } from './public/classes.js';
import { updateLapTime } from './lapTimes.js';

// Check that access keys are set
const result = checkAccessKeysExist();
// Key-variables ready to be used in the code
let receptionistKey, observerKey, safetyKey;
if (!result.success) {
  process.exit(1);
} else {
  receptionistKey = result.receptionistKey;
  observerKey = result.observerKey;
  safetyKey = result.safetyKey;
}

// Create an Express application
const app = express();
// Serve the public directory (statics)
app.use('/public', express.static('public'));
// Set ejs as the view engine (templating engine)
app.set('view engine', 'ejs');
// Parse JSON bodies (as sent by API clients) and URL encoded bodies to be able to read post request from login
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Create a HTTP server using the Express application
const server = createServer(app);

const __dirname = dirname(fileURLToPath(import.meta.url));

initializeDb()
  .then(db => {
    // Define a route handler for each interface
    app.get('/front-desk', (req, res) =>
      res.render('login', { errorMessage: '' })
    );
    app.post('/front-desk', (req, res) =>
      checkAccess(req, res, receptionistKey)
    );
    app.get('/race-control', (req, res) =>
      res.render('login', { errorMessage: '' })
    );
    app.post('/race-control', (req, res) => checkAccess(req, res, safetyKey));
    app.get('/lap-line-tracker', (req, res) =>
      res.render('login', { errorMessage: '' })
    );
    app.post('/lap-line-tracker', (req, res) =>
      checkAccess(req, res, observerKey)
    );
    app.get('/leader-board', (req, res) =>
      res.sendFile(join(__dirname, 'html', 'leaderBoard.html'))
    );
    app.get('/race-countdown', (req, res) =>
      res.sendFile(join(__dirname, 'html', 'countdown.html'))
    );
    app.get('/race-flags', (req, res) =>
      res.sendFile(join(__dirname, 'html', 'flag.html'))
    );
    app.get('/next-race', (req, res) =>
      res.sendFile(join(__dirname, 'html', 'nextRace.html'))
    );
    app.get('/timer', (req, res) => {
      const timerDuration = process.env.TIMER;
      res.json({ timerDuration: timerDuration });
    });

    // Attach socket.io to the HTTP server
    const io = new Server(server);
    io.on('connection', async (socket) => {
      // Emit all data needed by (re)connecting client
      try {
        const fetchDataForPreparation = await fetchreconnectDataforReception(db);
        socket.emit('reconnect_reception', fetchDataForPreparation);
  
        const nextSessionInfo = await fetchNextSessionDataFromUpdate(db);
        socket.emit('next_session', nextSessionInfo);
    
        const raceMode = await fetchRaceMode(db);
        socket.emit('race_mode', raceMode);
        socket.emit('reconnect_race_mode', raceMode);

        const upcomingSessionInfo = await fetchUpcomingSessionDataFromUpdate(db);
        socket.emit('upcoming_session', upcomingSessionInfo);
        
        const leaderboardInfo = await fetchLeaderboardDataFromDb(db, upcomingSessionInfo);
        if (upcomingSessionInfo.status === 'prepare' || upcomingSessionInfo.status === 'endSession') {
          socket.emit('reconnect_leaderboard', leaderboardInfo);
        }
        
        const endTime = await fetchEndTimeDataFromDb(db);
        socket.emit('end_time', endTime);
    
        const lapTimeDatas = await fetchLapTimeDataFromDb(db, upcomingSessionInfo);
        if (lapTimeDatas.length > 0) {
          for (const lapTimeData of lapTimeDatas) {
            socket.emit('update_lap_time', lapTimeData);
          }
        }
      } catch (error) {
        console.error('Error handling connection:', error);
      }
          
      // Listen for events from the clients
      socket.on('race_mode', async raceMode => {
        await saveRaceMode(db, raceMode);
        // When we receive 'racemode' event from a client, emit it to all clients
        io.emit('race_mode', raceMode);
      });

      socket.on('end_time', async endTime => {
        io.emit('end_time', endTime);
        await updateSessionStatus(db, endTime);

        if (endTime.action === 'start') {
          const nextSessionData = await fetchNextSessionDataFromEndTime(
            db,
            endTime
          );
          io.emit('next_session', nextSessionData);
        } else if (endTime.action === 'endSession') {
          const upcomingSessionData = await fetchNextSessionDataFromEndTime(
            db,
            endTime
          );
          io.emit('next_session', upcomingSessionData);
          io.emit('upcoming_session', upcomingSessionData);
        }
      });

      socket.on('update_session', async updatedSession => {
        await updateSessionInfo(db, updatedSession);
        const upcomingSessionData = await fetchUpcomingSessionDataFromUpdate(
          db
        );
        const nextSessionData = await fetchNextSessionDataFromUpdate(db);
        io.emit('upcoming_session', upcomingSessionData);
        io.emit('next_session', nextSessionData);
      });

      socket.on('lap_data', async lapTime  => {
        const updatedLapTime = await updateLapTime(db, lapTime);
        io.emit('update_lap_time', updatedLapTime);
      });
    });

    // Start the server
    const port = process.env.PORT || 3000;
    server.listen(port, () => console.log(`Server running on port ${port}...`));

    // ngrok is run in different terminal with the same port as the local host server:
    // ngrok http 3000
    // ./ngrok http 3000
  })
  .catch(error => {
    console.error('Error initializing database:', error.message);
    process.exit(1);
  });

async function fetchLeaderboardDataFromDb(db, upcomingSessionData) {
  // If race has eneded and new race has not yet started, fetch latest race's information
  if (upcomingSessionData.status === 'prepare' || upcomingSessionData.status === 'endSession') {
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
      return new sessionData(latestSession.id, 'endSession', driverInfo.map(r => r.driver_name));
    } catch (err) {
      console.error(err.message);
      throw err;
    }
  }
}

  

  async function fetchLapTimeDataFromDb(db, upcomingSessionInfo) {
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
      let laptime = new lapTimeUpdate(row.session_id, row.car_num, row.lap_num, row.fastest_lap);
      lapTimeDatas.push(laptime);
    }
    return lapTimeDatas;
  } catch (err) {
    console.error(err.message);
    throw err;
  }
}

async function updateSessionInfo(db, updatedSession) {
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

async function updateSessionStatus(db, endTime) {
  const sql = 'UPDATE sessions SET end_time = ?, status = ? WHERE id = ?';
  await db.run(
    sql,
    [endTime.endTime, endTime.action, endTime.sessionId],
    function (err) {
      if (err) {
        console.error(err.message);
      }
    }
  );
}

async function fetchNextSessionDataFromEndTime(db, endTime) {
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
  } catch (error) {
    console.error('Database error:', error.message);
    throw new Error('Failed to get next session data');
  }
}

async function fetchUpcomingSessionDataFromUpdate(db) {
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
    console.log('upcomingSessionId:', upcomingSessionData.sessionId);

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

async function fetchNextSessionDataFromUpdate(db) {
  try {
    const nextSessionData = new sessionData();
    const result = await db.get(
      "SELECT MIN(id) AS nextSessionId FROM sessions WHERE status = 'prepare'"
    );
    if (!result || !result.nextSessionId) {
      nextSessionData.sessionId = 0;
      return nextSessionData;
    }
    nextSessionData.sessionId = result.nextSessionId;
    const driverInfo = await db.all(
      'SELECT car_num, driver_name FROM driver_car_assignments WHERE session_id = ?',
      [result.nextSessionId]
    );
    nextSessionData.driverNameList = driverInfo.map(r => r.driver_name);

    nextSessionData.status = 'prepare';
    return nextSessionData;
  } catch (err) {
    console.error(err.message);
    throw err;
  }
}

async function fetchreconnectDataforReception(db) {
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

async function saveRaceMode(db, raceMode) {
  try {
    const sql = `UPDATE race_mode SET mode = ? WHERE id = 1`;
    await db.run(sql, [raceMode]);
  } catch (err) {
    console.error(err.message);
    throw err;
  }
}

async function fetchRaceMode(db) {
  const result = await db.get(
    'SELECT mode AS raceMode FROM race_mode WHERE id = 1'
  );
  return result.raceMode;
}

async function fetchEndTimeDataFromDb(db) {
  const endTime = new endTimeData();
  let result = await db.get(
    "SELECT id, end_time FROM sessions WHERE status = 'start'"
  );
  if (result && result.end_time) {
    endTime.action = 'start';
    endTime.endTime = result.end_time;
    endTime.sessionId = result.id;
    return endTime;
  } else {
    result = await db.get(
      "SELECT id, end_time FROM sessions WHERE status = 'finish'"
    );
    if (result && result.end_time) {
      endTime.action = 'finish';
      endTime.sessionId = result.id;
      return endTime;
    } else {
      result = await db.get(
        "SELECT MAX(id) AS id, end_time FROM sessions WHERE status = 'endSession'"
      );

      endTime.action = 'endSession';
      endTime.sessionId = result.id;
      return endTime;
    }
  }
}