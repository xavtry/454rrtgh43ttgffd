// Install dependencies: npm install express socket.io
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = 3000;

// Serve static files from "public" folder
app.use(express.static('public'));

// Player data
let players = {};
let stars = [];

// Create initial stars
for (let i = 0; i < 10; i++) {
  stars.push({
    id: i,
    x: Math.random() * 800,
    y: Math.random() * 600,
    golden: Math.random() < 0.1 // 10% chance golden
  });
}

io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);

  // Add player
  players[socket.id] = {
    id: socket.id,
    x: Math.random() * 800,
    y: Math.random() * 600,
    score: 0,
    name: "Player"
  };

  // Send existing game state
  socket.emit('init', { players, stars });

  // Broadcast new player to others
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // Handle movement
  socket.on('move', (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
    }
  });

  // Handle nickname
  socket.on('setName', (name) => {
    if (players[socket.id]) players[socket.id].name = name;
  });

  // Handle star collection
  socket.on('collectStar', (starId) => {
    let star = stars.find(s => s.id === starId);
    if (star && players[socket.id]) {
      players[socket.id].score += star.golden ? 5 : 1;
      // Respawn star
      star.x = Math.random() * 800;
      star.y = Math.random() * 600;
      star.golden = Math.random() < 0.1;
      io.emit('updateStars', stars);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    delete players[socket.id];
    io.emit('removePlayer', socket.id);
  });
});

// Broadcast player positions 30 times/sec
setInterval(() => {
  io.emit('playersUpdate', players);
}, 33);

http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
