let ingredLastUpdate = 0;
// update a player from server
const updateIngrediants = (data) => {
  if(ingredLastUpdate > data.lastUpdate) return;
  ingrediants = data.ingrediants;
  ingredLastUpdate = data.lastUpdate;
  
  let keys = Object.keys(ingrediants); // get all ingrediants id's
  // Iterate Ingrediants
  for(let i = 0; i < keys.length; i++) {
    ingrediants[keys[i]].alpha = 0.05;
  }
};

// update player ingredients
const updatePlayerIngredients = (data) => {
  if(players[data.id].lastUpdate > data.lastUpdate) return;
  players[data.id].ingrediants = data.ingredients;
};

// draw ingrediants
const drawIngreds = () => {
  let keys = Object.keys(ingrediants); // get all ingrediants id's
  // Iterate Ingrediants
  for(let i = 0; i < keys.length; i++)
  {
    const ingred = ingrediants[keys[i]];
    
    // keep animation running smoothly
    if(ingred.alpha < 1) ingred.alpha += 0.05;
    
    // set draw color to ingrediant color
    ctx.fillStyle = ingred.color;
    
    ingred.y = lerp(ingred.prevY, ingred.destY, ingred.alpha); // smooth transition with lerp

    ctx.fillRect(ingred.x, ingred.y, ingred.width, ingred.height);
  }
};

// drop ingredient from pressing Q
const dropIngredient = () => {
  let ingredKeys = Object.keys(players[id].ingrediants);
  // return if there are no ingredients
  if(ingredKeys.length == 0) return;
  
  socket.emit('dropIngredient', players[id].ingrediants[ingredKeys[ingredKeys.length - 1]].id);
};

// attempt to combine with colliding player
const combineIngredients = () => {
  let playerKeys = Object.keys(players);
  
  for(let i = 0; i < playerKeys.length; i++) {
    if(players[playerKeys[i]].id != id) { // if not this player, check collision
      const player1 = players[id];
      const player2 = players[playerKeys[i]];
      if(player1.x < player2.x + player2.width &&
      player1.x + player1.width > player2.x &&
      player1.y < player2.y + player2.height &&
       player1.y + player1.height > player2.y) {
        let player1IngredKeys = Object.keys(player1.ingrediants);
        let player2IngredKeys = Object.keys(player2.ingrediants);
        // see if colliding players have right ingredients
        if(player1IngredKeys.length == 1 && player2IngredKeys.length == 1 && player1.ingrediants[player1IngredKeys[0]].color != player2.ingrediants[player2IngredKeys[0]].color) {
          // tell server to increase player scores
          socket.emit('incrementScores', { p1ID: player1.id, p2ID: player2.id, p1Ingred: player1.ingrediants[player1IngredKeys[0]].id, p2Ingred: player2.ingrediants[player2IngredKeys[0]].id });
        }
      }
    }
  }
};