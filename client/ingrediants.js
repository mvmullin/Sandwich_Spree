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