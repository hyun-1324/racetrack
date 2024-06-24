// Import necessary modules
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { checkAccessKeysExist, checkAccess } from './accessKey.js';
import { initializeDb } from './database/initializeDb.js';
import { sessionData, endTimeData } from './public/classes.js';

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
    // Example of how to recieve and send data via the socket below (feel free to delete/modify)
    const io = new Server(server);
    io.on('connection', socket => {
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

      socket.on('reconnect', async request => {
        if (request === 'reception') {
          const fetchDataForPreparation = await fetchreconnectDataforReception(
            db
          );
          const lastId = await fetchLastId(db);
          socket.emit('reconnect_reception', fetchDataForPreparation, lastId);
        } else if (request === 'safety') {
          const upcomingSessionInfo = await fetchUpcomingSessionDataFromUpdate(
            db
          );
          const raceMode = await fetchRaceMode(db);
          socket.emit('reconnect_race_mode', raceMode);
          socket.emit('upcoming_session', upcomingSessionInfo);
        } else if (request === 'nextRace') {
          const nextSessionData = await fetchNextRaceData(db);

          io.emit('next_session', nextSessionData);
        } else if (request === 'flag') {
          const raceMode = await fetchRaceMode(db);
          socket.emit('race_mode', raceMode);
        } else if (request === 'countdown') {
          const endTime = await fetchEndTimeDataFromDb(db);
          socket.emit('end_time', endTime);
        }
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
      "SELECT MIN(id) AS upcomingSessionId FROM sessions WHERE status = 'start'"
    );
    upcomingSessionData.status = 'start';
    if (!row || !row.upcomingSessionId) {
      row = await db.get(
        "SELECT MIN(id) AS upcomingSessionId FROM sessions WHERE status = 'finish'"
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

async function fetchNextRaceData(db) {
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

async function fetchLastId(db) {
  let lastId;
  const result = await db.get('SELECT MAX(id) AS id FROM sessions');

  if (!result || !result.id) {
    lastId = 0;
    return lastId;
  }

  return result.id;
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
    "SELECT end_time AS endTime, id FROM sessions WHERE status = 'start'"
  );

  if (result && result.endTime) {
    endTime.action = 'start';
    endTime.endTime = result.endTime;
    return endTime;
  }

  if (!result || !result.endTime) {
    result = await db.get(
      "SELECT end_time AS endTime FROM sessions WHERE status = 'finish'"
    );

    if (result && result.endTime) {
      endTime.action = 'finish';
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
}
