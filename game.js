const { GRID_SIZE } = require('./public/constants.js');

function initGame() {
  const state = createGameState();
  randomFood(state);
  return state;
}

// Create game state that holds the game logic
function createGameState() {
  return {
    players: [{
      pos: {
        x: 3,
        y: 10,
      },
      vel: {
        x: 0,
        y: 0,
      },
      snake: [
        {x: 1, y: 10},
        {x: 2, y: 10},
        {x: 3, y: 10},
      ],
      foodEaten: 0,
      colorIndex: 0,
    }, {
      pos: {
        x: 18,
        y: 10,
      },
      vel: {
        x: 0,
        y: 0,
      },
      snake: [
        {x: 20, y: 10},
        {x: 19, y: 10},
        {x: 18, y: 10},
      ],
      foodEaten: 0,
      colorIndex: 0,
    }],
    color: [
      '#76C144',
      '#40BF86',
      '#3E8EBB',
      '#473EBB',
      '#9E3EBB',
      '#BB3EBB',
      '#BB3E64',
      '#BCC144',
      '#C8E3AB',
      '#E4F1F6',
    ],
    food: {},
    gridsize: GRID_SIZE,
  };
}

function updateColorIndex(player) {
  player.foodEaten++;
  if(player.foodEaten % 3 === 0) {
    player.colorIndex++;
    if(player.colorIndex > 10) {
      player.colorIndex = 0;
    }
  }
}

// Create game loop that updates the game state
function gameLoop(state) {
  if(!state) return;
  
  //we define playerOne
  const playerOne = state.players[0];
  const playerTwo = state.players[1];

  //we update the playerOne position relative to its velocity
  playerOne.pos.x += playerOne.vel.x;
  playerOne.pos.y += playerOne.vel.y;

  //we update the playerTwo position relative to its velocity
  playerTwo.pos.x += playerTwo.vel.x;
  playerTwo.pos.y += playerTwo.vel.y;

  //if the playerOne position is outside the grid, we return 2
  if(playerOne.pos.x < 0 || playerOne.pos.x > GRID_SIZE || playerOne.pos.y < 0 || playerOne.pos.y > GRID_SIZE) {
    return 2;
  }

  if(playerTwo.pos.x < 0 || playerTwo.pos.x > GRID_SIZE || playerTwo.pos.y < 0 || playerTwo.pos.y > GRID_SIZE) {
    return 1;
  }

  //if the playerOne has eaten the food we spawn more food, increase the snake length, and increase the frame rate
  if(state.food.x === playerOne.pos.x && state.food.y === playerOne.pos.y) {
    playerOne.snake.push({...playerOne.pos});
    playerOne.pos.x += playerOne.vel.x;
    playerOne.pos.y += playerOne.vel.y;
    randomFood(state);
    updateColorIndex(playerOne);
  }

  if(state.food.x === playerTwo.pos.x && state.food.y === playerTwo.pos.y) {
    playerTwo.snake.push({...playerTwo.pos});
    playerTwo.pos.x += playerTwo.vel.x;
    playerTwo.pos.y += playerTwo.vel.y;
    randomFood(state);
    updateColorIndex(playerTwo);
  }
  //if playerOne is moving
  if(playerOne.vel.x || playerOne.vel.y) {
    //if playerOne has collided with itself, we return 2
    for(let cell of playerOne.snake) {
      if(cell.x === playerOne.pos.x && cell.y === playerOne.pos.y) {
        return 2;
      }
    }
    //if playerOne has not collided with itself, we push the new position to the snake and shift the snake
    playerOne.snake.push({...playerOne.pos});
    playerOne.snake.shift();
  }

  if(playerTwo.vel.x || playerTwo.vel.y) {
    //if playerTwo has collided with itself, we return 1
    for(let cell of playerTwo.snake) {
      if(cell.x === playerTwo.pos.x && cell.y === playerTwo.pos.y) {
        return 1;
      }
    }
    //if playerTwo has not collided with itself, we push the new position to the snake and shift the snake
    playerTwo.snake.push({...playerTwo.pos});
    playerTwo.snake.shift();
  }
  return false;
}

// Create random food
function randomFood(state) {
  let food = {
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE),
  }

  for(let cell of state.players[0].snake) {
    if(cell.x === food.x && cell.y === food.y) {
      return randomFood(state);
    }
  }
  for(let cell of state.players[1].snake) {
    if(cell.x === food.x && cell.y === food.y) {
      return randomFood(state);
    }
  }
  state.food = food;
}

function getUpdatedVelocity(keyCode) {
  switch(keyCode) {
    case 37: { // left
      return {x: -1, y: 0};
    }
    case 38: { // up 
      return {x: 0, y: -1};
    }
    case 39: { // right
      return {x: 1, y: 0};
    }
    case 40: { // down 
      return {x: 0, y: 1};
    }
  }
}

module.exports = {
  initGame,
  gameLoop,
  getUpdatedVelocity
}