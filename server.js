require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const cors = require('cors');
const helmet = require('helmet');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();
var intervalOn = false; 

app.use(helmet({
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: {
    setTo: 'PHP 7.4.3'
  },
  noCache: true
}));

app.use('/public', express.static(process.cwd() + '/public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({origin: '*'})); 

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

//For FCC testing purposes
fccTestingRoutes(app);
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

const io = require('socket.io')(server);
const { initGame, gameLoop, getUpdatedVelocity } = require('./game.js');
const { FRAMERATE } = require('./public/constants.js');
const { makeid } = require('./public/utils.js');
const state = {};
const clientRooms = {};

io.on('connection', client => {

  client.on('keydown', handleKeydown);
  client.on('newGame', handleNewGame);
  client.on('joinGame', handleJoinGame);
  client.on('replay', handleReplay);
  client.on('countDown', handleCountDown);

  function handleJoinGame(roomName) {
    const room = io.sockets.adapter.rooms[roomName];

    let allUsers;
    if (room) {
      allUsers = room.sockets;
    }

    let numClients = 0;
    if (allUsers) {
      numClients = Object.keys(allUsers).length;
    }

    if (numClients === 0) {
      client.emit('unknownCode');
      return;
    } else if (numClients > 1) {
      client.emit('tooManyPlayers');
      return;
    }

    clientRooms[client.id] = roomName;

    client.join(roomName);
    client.number = 2;
    client.emit('init', 2);
    
    startGameInterval(roomName);
  }

  function handleNewGame() {
    let roomName = makeid(5);
    clientRooms[client.id] = roomName;
    client.emit('gameCode', roomName);

    state[roomName] = initGame();

    client.join(roomName);
    client.number = 1;
    client.emit('init', 1);
  }
  
  function handleKeydown(keyCode) {
    const roomName = clientRooms[client.id];
    if (!roomName) {
      return;
    }
    try {
      keyCode = parseInt(keyCode);
    } catch(e) {
      console.error(e);
      return;
    }

    const vel = getUpdatedVelocity(keyCode);

    if(vel) {
      // how to prevent 180 degree turns?
      if((state[roomName].players[client.number - 1].vel.x !== 0 && vel.x !== 0) || (state[roomName].players[client.number - 1].vel.y !== 0 && vel.y !== 0)) return;
      state[roomName].players[client.number - 1].vel = vel;
    }
  }

  function handleReplay() {
    if(!intervalOn) {
      intervalOn = true;
      const roomName = clientRooms[client.id];
      if (!roomName) {
        return;
      }
      io.sockets.in(roomName).emit('replay');
      state[roomName] = initGame();
      startGameInterval(roomName);
    }
  }

  function handleCountDown() {
    const roomName = clientRooms[client.id];
    if (!roomName) {
      return;
    }
    io.sockets.in(roomName).emit('countDown');
  }
});

function startGameInterval(roomName) {
  let count = 0;
  const intervalId = setInterval(() => {
    const winner = gameLoop(state[roomName]);
    console.log(count)
    count++;
    if (!winner) {
      emitGameState(roomName, state[roomName])
    } else {
      clearInterval(intervalId);
      intervalOn = false;
      emitGameOver(roomName, winner);
    }
  }, 1000 / 10);
}

function emitGameState(roomName, state) {
  io.sockets.in(roomName).emit('gameState', JSON.stringify(state))
}

function emitGameOver(roomName, winner) {
  io.sockets.in(roomName).emit('gameOver', JSON.stringify({ winner }))
}

module.exports = app; // For testing
