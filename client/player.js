const drawPlayers = () => {
  let keys = Object.keys(players); // get all player id's
  
  // Iterate players
  for(let i = 0; i < keys.length; i++)
  {
    const player = players[keys[i]];
    
    // keep animation running smoothly
    if(player.alpha < 1) player.alpha += 0.05;
    
    // set draw color to unique player color
    ctx.fillStyle = player.color;
    
    // draw player score
    ctx.font = '20px Arial';
    ctx.fillText(player.score, canvas.width - 50, i * 20 + 20);
    
    player.x = (player.destX == 0 || player.destX == canvas.width) ? player.destX : lerp(player.prevX, player.destX, player.alpha); // smooth transition with lerp
    //player.y = lerp(player.prevY, player.destY, player.alpha);

    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // draw bread on top of player
    breadWidth = player.width * 1.75;
    ctx.fillStyle = '#cc9966';
    ctx.fillRect(player.x - ((breadWidth - player.width) / 2), player.y - breadHeight, breadWidth, breadHeight);
    
    // draw any ingrediants on top of player
    let curY = player.y - breadHeight; // keep track of sandwich height
    let ingredKeys = Object.keys(player.ingrediants);
    for(let j = 0; j < ingredKeys.length; j++) {
      const ingred = player.ingrediants[ingredKeys[j]];
      curY -= ingred.height; // update current sandwich height
      ctx.fillStyle = ingred.color; // fill with ingrediant color
      ctx.fillRect(player.x - ((ingred.width - player.width) / 2), curY, ingred.width, ingred.height);
    }
  }
};

// update a player from server
const updatePlayer = (data) => {
  // if the player is new, add them to players and return
  if(!players[data.id])
  {
    players[data.id] = data;
    return;
  }

  // grab player object based on id
  const player = players[data.id];

  // return if player's last update is newer than this server data
  if(player.lastUpdate >= data.lastUpdate) {
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
const updatePlayerScores = (data) => {
  if(players[id].lastUpdate >= data.lastUpdate) return;
  
  players[data.p1ID].score += 1;
  players[data.p2ID].score += 1;
};

// remove player based on id
const removePlayer = (id) => {
  if(players[id]) {
    delete players[id];
  }
};

// set this player from server
const setPlayer = (data) => {
  id = data.id; // set id from server data
  color = data.color; // set color from server data
  players[id] = data; // set player with new id
  requestAnimationFrame(draw); // draw with new info
};

// function to update player position
const movePlayer = () => {
  const player = players[id]; // get this player with their id
  player.prevX = player.x;
  player.prevY = player.y;
  
  const speed = 5; // how far to move
  
  if(moveLeft) {
    if(player.destX < 0) player.destX = canvas.width;
    else player.destX -= speed;
  }
  if(moveRight) {
    if(player.destX > canvas.width) player.destX = 0;
    else player.destX += speed;
  }
  
  // reset alpha when moving to keep playing animation
  player.alpha = 0.05;
  
  // send movement to server
  socket.emit('move', player);
}