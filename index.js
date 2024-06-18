// Import necessary modules
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { checkAccessKeysExist, checkAccess } from './accessKey.js';
import { initializeDb } from './database/initializeDb.js';
import { sessionData } from './public/classes.js';

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
      socket.on('race_mode', raceMode => {
        // When we receive 'racemode' event from a client, emit it to all clients
        io.emit('race_mode', raceMode);
      });

      socket.on('end_time', async endTime => {
        io.emit('end_time', endTime);
        await updateSessionStatus(db, endTime);

        if (endTime.action === 'start') {
          const nextSessionData = await fetchNextSessionData(db, endTime);
          io.emit('next_session', nextSessionData);
        } else if (endTime.action === 'endSession') {
          const upcomingSessionData = await fetchNextSessionData(db, endTime);
          io.emit('upcoming_session', upcomingSessionData);
        }
      });

      socket.on('update_session', async updatedSession => {
        await updateSessionInfo(db, updatedSession);
        const upcomingSessionData = await fetchUpcomingSessionDataFromUpdate(
          db
        );
        const nextSessionData = await fetchNextSessionDataFromUpdate(db);
        console.log(upcomingSessionData);
        console.log(nextSessionData);
        io.emit('upcoming_session', upcomingSessionData);
        io.emit('next_session', nextSessionData);
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
  if (updatedSession.action === 'add') {
    const sqlSessions =
      "INSERT INTO sessions (id, status) VALUES (?, 'prepare')";
    await db.run(sqlSessions, [updatedSession.sessionId], function (err) {
      if (err) {
        return console.error(err.message);
      }
    });

    const sqlAssignments =
      'INSERT INTO driver_car_assignments (session_id, car_num) VALUES (?, ?)';
    for (let i = 1; i < 9; i++) {
      await db.run(
        sqlAssignments,
        [updatedSession.sessionId, i],
        function (err) {
          if (err) {
            return console.error(err.message);
          }
        }
      );
    }
  } else if (updatedSession.action === 'remove') {
    const sql = 'DELETE FROM users WHERE id = ?';
    await db.run(sql, [updatedSession.sessionId], function (err) {
      if (err) {
        return console.error(err.message);
      }
    });
  } else if (updatedSession.action === 'edit') {
    const sql =
      'UPDATE driver_car_assignments SET driver_name = ? WHERE session_id = ? AND car_num = ?';
    for (let i = 0; i < 8; i++) {
      let driverName = updatedSession.driverNameList[i];
      if (driverName === '') {
        driverName = null;
      }
      await db.run(
        sql,
        [driverName, updatedSession.sessionId, i + 1],
        function (err) {
          if (err) {
            console.error(err.message);
          }
        }
      );
    }
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

async function fetchNextSessionData(db, endTime) {
  const nextSessionData = new sessionData();
  try {
    const findSessionSql =
      'SELECT MIN(id) AS nextSessionId FROM sessions WHERE id > ?';
    const result = await db.get(
      findSessionSql,
      endTime.sessionId,
      function (err) {
        if (err) {
          return console.log(err.message);
        }
      }
    );

    if (!result || !result.nextSessionId) {
      nextSessionData.sessionId = 0;
      return nextSessionData;
    }

    nextSessionData.sessionId = result.nextSessionId;

    const fetchDriverInfoSql =
      'SELECT car_num, driver_name FROM driver_car_assignments WHERE session_id = ?';
    const rows = await db.all(
      fetchDriverInfoSql,
      result.nextSessionId,
      function (err) {
        if (err) {
          return console.log(err.message);
        }
      }
    );

    nextSessionData.driverNameList = rows.map(row => row.driver_name);
    return nextSessionData;
  } catch (error) {
    console.error('Database error:', error.message);
    throw new Error('Failed to get next session data');
  }
}

async function fetchUpcomingSessionDataFromUpdate(db) {
  const upcomingSessionData = new sessionData();
  const checkStartAndFinishStatus =
    "SELECT MIN(id) AS upcomingSessionId FROM sessions WHERE status = 'start' OR status = 'finish'";

  try {
    let row = await db.get(checkStartAndFinishStatus);

    if (!row || !row.upcomingSessionId) {
      const checkEndSessionStatus =
        "SELECT MAX(id) AS upcomingSessionId FROM sessions WHERE status = 'endSession'";
      row = await db.get(checkEndSessionStatus);

      const checkPrepareStatus =
        "SELECT MIN(id) AS upcomingSessionId FROM sessions WHERE status = 'prepare'";

      if (!row || !row.upcomingSessionId) {
        row = await db.get(checkPrepareStatus);
        console.log(row);

        if (!row || !row.upcomingSessionId) {
          upcomingSessionData.sessionId = 0;
          return upcomingSessionData;
        }
      }
    }

    upcomingSessionData.sessionId = row.upcomingSessionId;
    const fetchDriverInfoSql =
      'SELECT car_num, driver_name FROM driver_car_assignments WHERE session_id = ?';

    const rows = await db.all(fetchDriverInfoSql, [row.upcomingSessionId]);

    upcomingSessionData.driverNameList = rows.map(row => row.driver_name);
    return upcomingSessionData;
  } catch (err) {
    console.error(err.message);
  }
}

async function fetchNextSessionDataFromUpdate(db) {
  const nextSessionData = new sessionData();

  const fetchNextSessionId = `SELECT MIN(id) AS nextSessionId FROM sessions WHERE status = 'prepare'`;
  let result;
  result = await db.get(fetchNextSessionId, [], function (err) {
    if (err) {
      return console.log(err.message);
    }
  });

  if (!result || !result.nextSessionId) {
    nextSessionData.sessionId = 0;
    return nextSessionData;
  }

  nextSessionData.sessionId = result.nextSessionId;

  const fetchDriverInfoSql =
    'SELECT car_num, driver_name FROM driver_car_assignments WHERE session_id = ?';

  const rows = await db.all(fetchDriverInfoSql, [result.nextSessionId], err => {
    if (err) reject(err);
    else resolve(rows);
  });

  nextSessionData.driverNameList = rows.map(row => row.driver_name);
  return nextSessionData;
}
