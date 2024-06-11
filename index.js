// Import necessary modules
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const url = require('url');
const { join } = require('node:path');


// Create an Express application
const app = express();
// Create a HTTP server using the Express application
const server = http.createServer(app);

// Define a route handler for each interface
app.get('/leader-board', (req, res) => res.sendFile(join(__dirname, 'html', 'leaderBoard.html')));
app.get('/front-desk', (req, res) => res.sendFile(join(__dirname, 'html', 'reception.html')));
app.get('/race-control', (req, res) => res.sendFile(join(__dirname, 'html', 'safety.html')));
app.get('/lap-line-tracker', (req, res) => res.sendFile(join(__dirname, 'html', 'observer.html')));
app.get('/race-countdown', (req, res) => res.sendFile(join(__dirname, 'html', 'countdown.html')));
app.get('/race-flags', (req, res) => res.sendFile(join(__dirname, 'html', 'flag.html')));
app.get('/next-race', (req, res) => res.sendFile(join(__dirname, 'html', 'nextRace.html')));



// Attach socket.io to the HTTP server
// Example of how to recieve and send data via the socket below (feel free to delete/modify)
const io = socketIo(server);
io.on('connection', (socket) => {
    socket.on('racemode', (data) => {
      // When we receive 'racemode' event from a client, emit it to all clients
      io.emit('racemode', data);
    });
  });

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server running on port ${port}...`));

// ngrok is run in different terminal with the same port as the local host server:
// ngrok http 3000
// ./ngrok http 3000