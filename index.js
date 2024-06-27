// Import necessary modules
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { promises as fs } from 'node:fs';
import express from 'express';
import { Server } from 'socket.io';
import moment from 'moment';
import { checkAccessKeysExist, checkAccess } from './dataHandling/accessKey.js';
import { initializeDb } from './database/initializeDb.js';
import { sessionData, endTimeData } from './public/classes.js';
import { updateLapTime, fetchLeaderboardDataFromDb, fetchLapTimeDataFromDb } from './dataHandling/lapTimes.js';
import { 
  fetchNextSessionData, 
  fetchUpcomingSessionDataFromUpdate, 
  updateSessionInfo, 
  updateSessionStatus, 
  fetchNextSessionDataFromEndTime,
  fetchEndTimeDataFromDb,
  saveRaceMode,
  fetchRaceMode,
  fetchReconnectDataforReception,
  fetchLastId 
} from './dataHandling/sessions.js';

// Check that access keys are set
const result = checkAccessKeysExist();
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
// Serve the static files from public directory
app.use('/public', express.static('public'));
// Set ejs as the view engine (templating engine)
app.set('view engine', 'ejs');
// Parse JSON bodies (as sent by API clients) and URL encoded bodies to be able to read post request from login
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Create a HTTP server using the Express application
const server = createServer(app);

// Get the current directory name to serve html files
const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize the database
initializeDb().then(db => {
    // Define a route handler for each interface
    app.route('/front-desk')
      .get((_, res) => res.render('login', { errorMessage: '' }))
      .post((req, res) => checkAccess(req, res, receptionistKey));
    app.route('/race-control')
      .get((_, res) => res.render('login', { errorMessage: '' }))
      .post((req, res) => checkAccess(req, res, safetyKey));
    app.route('/lap-line-tracker')
      .get((_, res) => res.render('login', { errorMessage: '' }))
      .post((req, res) => checkAccess(req, res, observerKey));
    app.route('/leader-board')
      .get((_, res) => res.sendFile(join(__dirname, 'html', 'leaderBoard.html')));
    app.route('/race-countdown')
      .get((_, res) => res.sendFile(join(__dirname, 'html', 'countdown.html')));
    app.route('/race-flags')
      .get((_, res) =>res.sendFile(join(__dirname, 'html', 'flag.html')));
    app.route('/next-race')
      .get((_, res) => res.sendFile(join(__dirname, 'html', 'nextRace.html')));
    app.route('/timer')
      .get((_, res) => {
      const timerDuration = process.env.TIMER;
      res.json({ timerDuration: timerDuration });
    });

    // Attach socket.io to the HTTP server
    const io = new Server(server);
    io.on('connection', async socket => {
      // Emit all data needed by (re)connecting client
      try {
        const fetchDataForPreparation = await fetchReconnectDataforReception(db);
        const lastId = await fetchLastId(db);
        socket.emit('reconnect_reception', fetchDataForPreparation, lastId);

        const nextSessionData = await fetchNextSessionData(db);
        socket.emit('next_session', nextSessionData);

        const raceMode = await fetchRaceMode(db);
        socket.emit('reconnect_race_mode', raceMode);
        socket.emit('race_mode', raceMode);

        let upcomingSessionInfo = await fetchUpcomingSessionDataFromUpdate(db);
        socket.emit('upcoming_session', upcomingSessionInfo);

        const leaderboardInfo = await fetchLeaderboardDataFromDb(db, upcomingSessionInfo);
        if (
          upcomingSessionInfo.status === 'prepare' ||
          upcomingSessionInfo.status === 'endSession'
        ) {
          socket.emit('reconnect_leaderboard', leaderboardInfo);
          upcomingSessionInfo = leaderboardInfo;
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
        console.error('Error fetching connection data:', error);
      }

      // Listen for events from the clients
      socket.on('race_mode', async raceMode => {
        await saveRaceMode(db, raceMode);
        io.emit('race_mode', raceMode);
      });

      socket.on('end_time', async endTime => {
        io.emit('end_time', endTime);
        await updateSessionStatus(db, endTime);
        if (endTime.action === 'start') {
          const nextSessionData = await fetchNextSessionDataFromEndTime(db,endTime);
          io.emit('next_session', nextSessionData);
        } else if (endTime.action === 'endSession') {
          const upcomingSessionData = await fetchNextSessionDataFromEndTime(db, endTime);
          io.emit('next_session', upcomingSessionData);
          io.emit('upcoming_session', upcomingSessionData);
        }
      });

      socket.on('update_session', async updatedSession => {
        await updateSessionInfo(db, updatedSession);
        const upcomingSessionData = await fetchUpcomingSessionDataFromUpdate(db);
        const nextSessionData = await fetchNextSessionData(db);
        io.emit('upcoming_session', upcomingSessionData);
        io.emit('next_session', nextSessionData);
      });

      socket.on('lap_data', async lapTime => {
        const updatedLapTime = await updateLapTime(db, lapTime);
        io.emit('update_lap_time', updatedLapTime);
      });

      socket.on('reset', async () => {
        try {
          const dbPath = join(__dirname, 'database', 'database.db');
          const initSqlPath = join(__dirname, 'database', 'initial.sql');
          const backupFolderPath = join(__dirname, 'database', 'backup');
          const backupFileName = `database_${moment().format('YYYYMMDD_HHmmss')}.db`;
          const backupFilePath = join(backupFolderPath, backupFileName);
          await fs.mkdir(backupFolderPath, { recursive: true });
          await fs.copyFile(dbPath, backupFilePath);
          
          const sql = await fs.readFile(initSqlPath, 'utf8');
          await db.exec(sql);

          io.emit('next_session', new sessionData(0));
          io.emit('upcoming_session', new sessionData(0));
          io.emit('end_time', new endTimeData(0, 'reset'));
          io.emit('race_mode', 'danger');
        } catch (error) {
          console.error('Error saving and reseting database:', error);
        }
      });
    });

    // Start the server on port 3000
    const port = process.env.PORT || 3000;
    server.listen(port, () => console.log(`Server running on port ${port}...`));

  })
  .catch(error => {
    console.error('Error initializing database:', error.message);
    process.exit(1);
  });
