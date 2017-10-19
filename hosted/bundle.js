'use strict';

var ingredLastUpdate = 0;
// update a player from server
var updateIngrediants = function updateIngrediants(data) {
  if (ingredLastUpdate > data.lastUpdate) return;
  ingrediants = data.ingrediants;
  ingredLastUpdate = data.lastUpdate;

  var keys = Object.keys(ingrediants); // get all ingrediants id's
  // Iterate Ingrediants
  for (var i = 0; i < keys.length; i++) {
    ingrediants[keys[i]].alpha = 0.05;
  }
};

// update player ingredients
var updatePlayerIngredients = function updatePlayerIngredients(data) {
  if (players[data.id].lastUpdate > data.lastUpdate) return;
  players[data.id].ingrediants = data.ingredients;
};

// draw ingrediants
var drawIngreds = function drawIngreds() {
  var keys = Object.keys(ingrediants); // get all ingrediants id's
  // Iterate Ingrediants
  for (var i = 0; i < keys.length; i++) {
    var ingred = ingrediants[keys[i]];

    // keep animation running smoothly
    if (ingred.alpha < 1) ingred.alpha += 0.05;

    // set draw color to ingrediant color
    ctx.fillStyle = ingred.color;

    ingred.y = lerp(ingred.prevY, ingred.destY, ingred.alpha); // smooth transition with lerp

    ctx.fillRect(ingred.x, ingred.y, ingred.width, ingred.height);
  }
};

// drop ingredient from pressing Q
var dropIngredient = function dropIngredient() {
  var ingredKeys = Object.keys(players[id].ingrediants);
  // return if there are no ingredients
  if (ingredKeys.length == 0) return;

  socket.emit('dropIngredient', players[id].ingrediants[ingredKeys[ingredKeys.length - 1]].id);
};

// attempt to combine with colliding player
var combineIngredients = function combineIngredients() {
  var playerKeys = Object.keys(players);

  for (var i = 0; i < playerKeys.length; i++) {
    if (players[playerKeys[i]].id != id) {
      // if not this player, check collision
      var player1 = players[id];
      var player2 = players[playerKeys[i]];
      if (player1.x < player2.x + player2.width && player1.x + player1.width > player2.x && player1.y < player2.y + player2.height && player1.y + player1.height > player2.y) {
        var player1IngredKeys = Object.keys(player1.ingrediants);
        var player2IngredKeys = Object.keys(player2.ingrediants);
        // see if colliding players have right ingredients
        if (player1IngredKeys.length == 1 && player2IngredKeys.length == 1 && player1.ingrediants[player1IngredKeys[0]].color != player2.ingrediants[player2IngredKeys[0]].color) {
          // tell server to increase player scores
          socket.emit('incrementScores', { p1ID: player1.id, p2ID: player2.id, p1Ingred: player1.ingrediants[player1IngredKeys[0]].id, p2Ingred: player2.ingrediants[player2IngredKeys[0]].id });
        }
      }
    }
  }
};
'use strict';

var id = void 0; // player's unique id
var color = void 0; // player's unique color
var socket = void 0; // player's socket
var players = {}; // object to hold player properties
var ingrediants = {}; // object to hold falling ingrediants
var ingrediantNum = 0;
var moveLeft = false; // left or a held
var moveRight = false; // right or d held

var canvas = void 0;
var ctx = void 0;

// bread properties
var breadHeight = 10;
var breadWidth = 30;

//redraw canvas
var draw = function draw() {
  movePlayer(); // get player movement
  checkCollisions();

  ctx.clearRect(0, 0, canvas.width, canvas.height); // clear screen

  drawPlayers();
  drawIngreds();
  requestAnimationFrame(draw); // continue to draw updates
};

// linear interpolation to jump percentages to new position
var lerp = function lerp(v0, v1, alpha) {
  return (1 - alpha) * v0 + alpha * v1;
};

// object to keep track of keys that are down
var keysDown = {};
// function to update player movement based on keys down.
var keyDownHandler = function keyDownHandler(e) {
  e = e || event;

  // If key isn't held check press commands
  if (!keysDown[e.keyCode]) {
    switch (e.keyCode) {
      case 81:
        // Q
        dropIngredient();
        break;
      case 69:
        // E
        combineIngredients();
        break;
      default:
        break;
    }
  }

  keysDown[e.keyCode] = e.type == 'keydown'; // check if key is down

  moveLeft = keysDown[37] || keysDown[65]; // left or a held
  moveRight = keysDown[39] || keysDown[68]; // right or d held

};

// function to check object collisions
var checkCollisions = function checkCollisions() {

  var ingrediantKeys = Object.keys(ingrediants);
  var player = players[id];

  // check for collision between this player and each ingrediant
  for (var i = 0; i < ingrediantKeys.length; i++) {
    var ingrediant = ingrediants[ingrediantKeys[i]];

    if (ingrediant.x < player.x + player.width && ingrediant.x + ingrediant.width > player.x && ingrediant.y < player.y + player.height && ingrediant.y + ingrediant.height > player.y) {

      socket.emit('claimIngrediant', ingrediant.id);
    }
  }
};

// initialize scripts
var init = function init() {

  socket = io.connect();
  canvas = document.querySelector('#myCanvas');
  ctx = canvas.getContext('2d');

  socket.on('connect', function () {
    socket.emit('join', { width: canvas.width, height: canvas.height });
  });

  socket.on('joined', setPlayer); // set player on server 'joined' event
  socket.on('updateMovement', updatePlayer); // update on server 'updateClient' event
  socket.on('updateIngreds', updateIngrediants);
  socket.on('updatePlayerIngreds', updatePlayerIngredients);
  socket.on('updatePlayerScores', updatePlayerScores);
  socket.on('left', removePlayer); // remove player on server 'removePlayer event

  document.body.addEventListener('keydown', keyDownHandler);
  document.body.addEventListener('keyup', keyDownHandler);
};

window.onload = init;
'use strict';

var drawPlayers = function drawPlayers() {
  var keys = Object.keys(players); // get all player id's

  // Iterate players
  for (var i = 0; i < keys.length; i++) {
    var player = players[keys[i]];

    // keep animation running smoothly
    if (player.alpha < 1) player.alpha += 0.05;

    // set draw color to unique player color
    ctx.fillStyle = player.color;

    // draw player score
    ctx.font = '20px Arial';
    ctx.fillText(player.score, canvas.width - 50, i * 20 + 20);

    player.x = player.destX == 0 || player.destX == canvas.width ? player.destX : lerp(player.prevX, player.destX, player.alpha); // smooth transition with lerp
    //player.y = lerp(player.prevY, player.destY, player.alpha);

    ctx.fillRect(player.x, player.y, player.width, player.height);

    // draw bread on top of player
    breadWidth = player.width * 1.75;
    ctx.fillStyle = '#cc9966';
    ctx.fillRect(player.x - (breadWidth - player.width) / 2, player.y - breadHeight, breadWidth, breadHeight);

    // draw any ingrediants on top of player
    var curY = player.y - breadHeight; // keep track of sandwich height
    var ingredKeys = Object.keys(player.ingrediants);
    for (var j = 0; j < ingredKeys.length; j++) {
      var ingred = player.ingrediants[ingredKeys[j]];
      curY -= ingred.height; // update current sandwich height
      ctx.fillStyle = ingred.color; // fill with ingrediant color
      ctx.fillRect(player.x - (ingred.width - player.width) / 2, curY, ingred.width, ingred.height);
    }
  }
};

// update a player from server
var updatePlayer = function updatePlayer(data) {
  // if the player is new, add them to players and return
  if (!players[data.id]) {
    players[data.id] = data;
    return;
  }

  // grab player object based on id
  var player = players[data.id];

  // return if player's last update is newer than this server data
  if (player.lastUpdate >= data.lastUpdate) {
    return;
  }

  //update positions to lerp between
  player.prevX = data.prevX;
  player.prevY = data.prevY;
  player.destX = data.destX;
  player.destY = data.destY;

  // reset lerp percentage
  player.alpha = 0.05;
};

// update player scores from server
var updatePlayerScores = function updatePlayerScores(data) {
  if (players[id].lastUpdate >= data.lastUpdate) return;

  players[data.p1ID].score += 1;
  players[data.p2ID].score += 1;
};

// remove player based on id
var removePlayer = function removePlayer(id) {
  if (players[id]) {
    delete players[id];
  }
};

// set this player from server
var setPlayer = function setPlayer(data) {
  id = data.id; // set id from server data
  color = data.color; // set color from server data
  players[id] = data; // set player with new id
  requestAnimationFrame(draw); // draw with new info
};

// function to update player position
var movePlayer = function movePlayer() {
  var player = players[id]; // get this player with their id
  player.prevX = player.x;
  player.prevY = player.y;

  var speed = 5; // how far to move

  if (moveLeft) {
    if (player.destX < 0) player.destX = canvas.width;else player.destX -= speed;
  }
  if (moveRight) {
    if (player.destX > canvas.width) player.destX = 0;else player.destX += speed;
  }

  // reset alpha when moving to keep playing animation
  player.alpha = 0.05;

  // send movement to server
  socket.emit('move', player);
};
