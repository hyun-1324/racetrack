// Import necessary modules
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { checkAccessKeysExist, checkAccess } from './accessKey.js';
import { initializeDb } from "./database/initializeDb.js";

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

initializeDb().then((db) => {
  // Define a route handler for each interface
  app.get('/front-desk', (req, res) => res.render('login', { errorMessage: '' }));
  app.post('/front-desk', (req, res) => checkAccess(req, res, receptionistKey));
  app.get('/race-control', (req, res) => res.render('login', { errorMessage: '' }));
  app.post('/race-control', (req, res) => checkAccess(req, res, safetyKey));
  app.get('/lap-line-tracker', (req, res) => res.render('login', { errorMessage: '' }));
  app.post('/lap-line-tracker', (req, res) => checkAccess(req, res, observerKey));
  app.get('/leader-board', (req, res) => res.sendFile(join(__dirname, 'html', 'leaderBoard.html')));
  app.get('/race-countdown', (req, res) => res.sendFile(join(__dirname, 'html', 'countdown.html')));
  app.get('/race-flags', (req, res) => res.sendFile(join(__dirname, 'html', 'flag.html')));
  app.get('/next-race', (req, res) => res.sendFile(join(__dirname, 'html', 'nextRace.html')));

  // Attach socket.io to the HTTP server
  // Example of how to recieve and send data via the socket below (feel free to delete/modify)
  const io = new Server(server);
  io.on("connection", (socket) => {
    socket.on("racemode", (data) => {
      // When we receive 'racemode' event from a client, emit it to all clients
      io.emit("racemode", data);
    });
  });

  // Start the server
  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log(`Server running on port ${port}...`));

  // ngrok is run in different terminal with the same port as the local host server:
  // ngrok http 3000
  // ./ngrok http 3000
}).catch((error) => {
    console.error("Error initializing database:", error.message);
    process.exit(1);
  });
