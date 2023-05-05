const BG_COLOR = '#231f20';
const SNAKE_COLOR = '#d42450';
const SNAKE2_COLOR = '#00ffff';
const FOOD_COLOR = '#e66916';

const socket = io('https://shhnake-valentinwissler42.b4a.run');
socket.on('init', handleInit);
socket.on('gameState', handleGameState);
socket.on('gameOver', handleGameOver);
socket.on('gameCode', handleGameCode);
socket.on('unknownGame', handleUnknownGame);
socket.on('tooManyPlayers', handleTooManyPlayers);
socket.on('replay', handleReplay)


const gameScreen = document.getElementById('gameScreen');
const initialScreen = document.getElementById('initialScreen');
const newGameBtn = document.getElementById('newGameButton');
const joinGameBtn = document.getElementById('joinGameButton');
const gameCodeInput = document.getElementById('gameCodeInput');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');
const gameOverScreen = document.getElementById('gameOverScreen');
const winningPlayer = document.getElementById('winningPlayer');
const playAgainBtn = document.getElementById('playAgainButton');
const returnToLobbyBtn = document.getElementById('returnToLobbyButton');
let canvas, ctx, playerNumber;
let gameActive = false;

newGameBtn.addEventListener('click', newGame);
joinGameBtn.addEventListener('click', joinGame);
playAgainBtn.addEventListener('click', replay);

function replay() {
  socket.emit('replay');
}

function handleReplay() {
  initCanvas();
}

function newGame() {
  socket.emit('newGame');
  initCanvas();
}

function joinGame() {
  const code = gameCodeInput.value;
  socket.emit('joinGame', code);
  initCanvas();
}

function initCanvas() {
  initialScreen.style.display = 'none';
  gameOverScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  canvas.width = canvas.height = 600;

  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  document.addEventListener('keydown', keydown);
  gameActive = true;
}

function paintGame(state) {
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const food = state.food;
  const gridsize = state.gridsize;
  const size = canvas.width / gridsize;

  ctx.fillStyle = FOOD_COLOR;
  ctx.fillRect(food.x * size, food.y * size, size, size);

  paintPlayer(state.players[0], size, state.color[state.players[0].colorIndex]);
  paintPlayer(state.players[1], size, state.color[state.players[1].colorIndex]);
}

function paintPlayer(player, size, color) {
  const snake = player.snake;

  ctx.fillStyle = color;
  for(let cell of snake) {
    ctx.fillRect(cell.x * size, cell.y * size, size, size);
  }
}

function keydown(e) {
  console.log(e.keyCode)
  socket.emit('keydown', e.keyCode);
}

function handleInit(number) {
  playerNumber = number;
}

function handleGameState(gameState) {
  if(!gameActive) return;
  gameState = JSON.parse(gameState);
  requestAnimationFrame(() => paintGame(gameState));
}

function handleGameOver(data) {
  if(!gameActive) return;
  data = JSON.parse(data);
  if(data.winner == 1) {
    winningPlayer.innerText = '1';
  } else {
    winningPlayer.innerText = '2';
  }
  initialScreen.style.display = 'none';
  gameScreen.style.display = 'none';
  gameOverScreen.style.display = 'block';
}

function handleGameCode(code) {
  gameCodeDisplay.innerText = code;
}

function handleUnknownGame() {
  reset();
  alert('Unknown Game Code');
}

function handleTooManyPlayers() {
  reset();
  alert('This game is already in progress');
}

function reset() {
  playerNumber = null;
  gameCodeInput.value = '';
  gameCodeDisplay.innerText = '';
  initialScreen.style.display = 'block';
  gameScreen.style.display = 'none';
  gameOverScreen.style.display = 'none';
}