const xxh = require('xxhashjs');

let io;

// const canvasW = 600;
const canvasH = 400;

// num in each room
const roomCounts = {};

// Keep track room socket is in
const rooms = {};

// Keep track of players
const players = {};

// possible sandwich ingrediants
const ingrediantList = {
  JELLY: '#660033',
  PEANUTBUTTER: '#805500',
};

const activeIngrediants = {};

const fallSpeed = 9.8;

// function to handle new sockets and create new players
const createPlayer = (sock) => {
  const socket = sock;

  socket.on('join', (data) => {
    if (Object.keys(roomCounts).length === 0) {
      const room = 'room0';
      socket.join(room);
      rooms[socket.name] = room;
      roomCounts[room] = 1;
    } else {
      const roomKeys = Object.keys(roomCounts); // get each room
      let foundRoom = false; // remains false if all rooms are full
      for (let i = 0; i < roomKeys.length; i++) {
        if (roomCounts[roomKeys[i]] < 5) {
          const room = `room${i}`;
          socket.join(room);
          rooms[socket.name] = room;
          roomCounts[room]++;
          foundRoom = true;
          break;
        }
      }
      if (!foundRoom) {
        const room = `room${roomKeys.length}`;
        socket.join(room);
        rooms[socket.name] = room;
        roomCounts[room] = 1;
      }
    }

    // create a new player object and add it to list keyed with socket name
    players[socket.name] = {
      id: xxh.h32(`${socket.id}${new Date().getTime()}`, 0xBADD00D5).toString(16), // unique id
      lastUpdate: new Date().getTime(), // last time player was updated
      x: data.width / 2, // default x coord of player
      y: data.height - 25, // default y coord of player
      // code from http://www.daverabideau.com/blog/ to generate random color
      color: `#${(`000000${Math.random().toString(16).slice(2, 8).toUpperCase()}`).slice(-6)}`,
      prevX: 0, // default last known x coord
      prevY: 0, // default last known y coord
      destX: data.width / 2, // default desired x coord
      destY: 0, // default desired y coord
      alpha: 0, // default % from prev to dest
      height: 25, // default player height
      width: 25, // default player width
      score: 0,
    };

    socket.emit('joined', players[socket.name]);
  });
};

// function to process client movement
const onMove = (sock) => {
  const socket = sock;

  socket.on('move', (data) => {
    players[socket.name] = data;

    players[socket.name].lastUpdate = new Date().getTime();
    socket.broadcast.to(rooms[socket.name]).emit('updateMovement', players[socket.name]);
  });
};

const spawnIngrediant = () => {
  const roomKeys = Object.keys(roomCounts); // get each room
  for (let i = 0; i < roomKeys.length; i++) {
    const keys = Object.keys(ingrediantList); // get active ingrediant keys
    // get random ingrediant from ingrediants list
    const ingrediantColor = ingrediantList[keys[Math.floor(Math.random() * keys.length)]];

    const randomX = Math.floor((Math.random() * 600) + 1);
    // create chosen ingrediant
    const ingrediant = {
      id: xxh.h32(`${new Date().getTime()}`, 0xBADD00D5).toString(16), // unique id
      x: randomX, // default x coord of player
      y: 0, // default y coord of player
      color: ingrediantColor, // color of ingrediant, used to identify ingrediant
      prevX: 0, // default last known x coord
      prevY: 0, // default last known y coord
      destX: randomX, // default desired x coord
      destY: 0, // default desired y coord
      alpha: 0, // default % from prev to dest
      height: 7, // default player height
      width: 30, // default player width
      held: false,
    };
    if (activeIngrediants[roomKeys[i]] == null) activeIngrediants[roomKeys[i]] = {};
    activeIngrediants[roomKeys[i]][ingrediant.id] = ingrediant;
  }
};

// function to have ingrediants fall
const updateIngrediants = () => {
  const roomKeys = Object.keys(roomCounts); // get each room
  for (let i = 0; i < roomKeys.length; i++) {
    if (activeIngrediants[roomKeys[i]] != null) {
      if (Object.keys(activeIngrediants[roomKeys[i]]).length !== 0) {
        const roomsIngrediants = activeIngrediants[roomKeys[i]];
        const keys = Object.keys(roomsIngrediants); // get active ingrediant keys
        for (let j = 0; j < keys.length; j++) {
          if (roomsIngrediants[keys[j]].y > canvasH) delete roomsIngrediants[keys[j]];
          else {
            roomsIngrediants[keys[j]].prevY = roomsIngrediants[keys[j]].y;
            roomsIngrediants[keys[j]].destY += fallSpeed;
            roomsIngrediants[keys[j]].y = roomsIngrediants[keys[j]].destY;
          }
        }

        const lastUpdate = new Date().getTime(); // last update for this room's ingreds
        activeIngrediants[roomKeys[i]] = roomsIngrediants;
        io.sockets.in(roomKeys[i]).emit('updateIngreds', { lastUpdate, ingrediants: activeIngrediants[roomKeys[i]] });
      }
    }
  }
};

// delete players that disconnect
const onDisconnect = (sock) => {
  const socket = sock;

  socket.on('disconnect', () => {
    io.sockets.in(rooms[socket.name]).emit('left', players[socket.name].id); // notify clients
    socket.leave(rooms[socket.name]); // remove socket from room
    roomCounts[rooms[socket.name]]--;
    if (roomCounts[rooms[socket.name]] <= 0) delete roomCounts[rooms[socket.name]];
    delete rooms[socket.name];
  });
};

const configure = (ioServer) => {
  io = ioServer;

  setInterval(spawnIngrediant, 1000);
  setInterval(updateIngrediants, 100);

  io.sockets.on('connection', (socket) => {
    createPlayer(socket);
    onMove(socket);
    onDisconnect(socket);
  });
};

module.exports.configure = configure;
