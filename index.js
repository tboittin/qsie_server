const express = require("express");
const socketio = require("socket.io");

const http = require("http");
const cors = require("cors");

const PORT = process.env.PORT || 5000;

const router = require("./router");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(router);
app.use(cors());

const users = [];

// Join
const existingUser = (name) => {
  console.log('existingUser', name);
  name = name.trim().toLowerCase();
  const existing = users.find((user) => user.name === name);
  if (existing) {
    console.log('existingUser', true)
    return true;
  } else {
    console.log('existingUser', false)
    return false;
  }
}

const addUser = ( id, name ) => {
  console.log("addUser");

  const user = { id, name };
  console.log(user)
  users.push(user);
  console.log('addUser, users:', users)
};

// Rooms
const getRooms = () => {
  console.log("getRooms");
  console.log(io.sockets.adapter.rooms);
  console.log(Object.keys(io.sockets.adapter.rooms));
  console.log(users);
  let rooms = [];
  let roomsLength = Object.keys(io.sockets.adapter.rooms).length;
  for (i = 0; i < roomsLength; i++) {
    let nbOfPlayersInRooms = Object.values(io.sockets.adapter.rooms)[i].length;
    if (nbOfPlayersInRooms === 1) {
      let roomsName = Object.keys(io.sockets.adapter.rooms)[i];
      let roomsId = Object.keys(
        Object.values(io.sockets.adapter.rooms)[i].sockets
      )[0];
      let room = { id: roomsId, name: roomsName };
      if (room.id !== room.name) {
        rooms.push(room);
      }
    }
  }
  return rooms;
};

const joinRoom = ({ id, name, room }) => {
  console.log("joinRoom");
  room = room.trim().toLowerCase();

  const roomIsFull = users.filter((user) => user.room === room).length >= 2;
  if (roomIsFull) {
    return { error: "Ce salon est déjà plein, veuillez en choisir un autre" };
  }

  const user = { id, name, room };

  let i = users.findIndex((user) => user.id === id);
  users[i] = user;
  return { user };
};

const roomLength = (room) => {
  console.log('roomLength')
  const roomIsStillAvailable = Object.keys(io.sockets.adapter.rooms).includes(room);
  if (roomIsStillAvailable) {
    room = room.trim().toLowerCase();
    let nbOfPlayersInRoom = io.sockets.adapter.rooms[room].length;
    return nbOfPlayersInRoom;
  } else {
    return 2; //La salle n'est plus disponible
  }
}

// Choose Character
const addCharacter = ({ id, clientCharacter }) => {
  console.log("addCharacter");
  const userIndex = users.findIndex((user) => user.id === id);
  users[userIndex] = { ...users[userIndex], character: clientCharacter };
};

// Game
const getNbOfPlayersInRoom = (room) => {
  console.log("getNbOfPlayersInRoom");
  room = room.trim().toLowerCase();
  let chosenRoom = io.sockets.adapter.rooms[room];
  let nbOfPlayersInRooms = chosenRoom.length;
  return nbOfPlayersInRooms;
};

const retrieveOpponentData = ({ id, room }) => {
  console.log("retrieveOpponentData");
  const usersInRoom = users.filter((u) => u.room === room);
  const otherUser = usersInRoom.filter((userInRoom) => userInRoom.id !== id)[0];
  if (otherUser === undefined) {
    console.log(users);
    console.log(io.sockets.adapter.rooms);
    return {
      error:
        "Problème lors de la récupération des données de l'adversaire, réessaye plus tard",
    };
  }
  let opponentName = otherUser.name;
  let opponentCharacter = otherUser.character;
  return { opponentName, opponentCharacter };
};

// Win Screen

const removeUser = (id) => {
  console.log("removeUser");
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

io.on("connection", (socket) => {
  console.log("a user connected: ", socket.id);

  socket.on('existingUser', (name) => {
    console.log('on existingUser')
    if (existingUser(name) === false) {
      console.log('emitExistingUser', false)
      socket.emit('existingUser', false);
    } else {
      console.log('emitExistingUser', true)
      socket.emit('existingUser', true);
    }
  })

  socket.on("login", ( name ) => {
    console.log('on login')
    addUser(socket.id, name);
  });

  socket.on("disconnect", () => {
    console.log('on disconnect')
    const user = users.filter((u) => u.id === socket.id)[0];
    console.log("a user disconnected: ", socket.id);
    if (user) {
      removeRoomUsersCharacter(user.room);
      console.log('emit to room endgame')
      io.to(user.room).emit("endGame");
      console.log('emit to room redirectToRooms')
      io.to(user.room).emit("redirectToRooms");
      removeUser(socket.id);
    }
  });

  socket.on("getRooms", () => {
    console.log("on getRooms");
    let rooms = getRooms();
    console.log('emit rooms')
    socket.emit("rooms", rooms);
  });

  socket.on("characterPicked", ({ name, clientCharacter, room }) => {
    console.log('on characterPicked')
    addCharacter({ id: socket.id, room, clientCharacter });
    console.log(clientCharacter.name, "has been picked in", room, "by", name);
  });

  socket.on("startGame", ({ name, clientCharacter, room }, callback) => {
    console.log("on startGame");
    if (room) {
      if (getNbOfPlayersInRoom(room) === 2) {
        console.log("2 players in room");
        const { error, opponentName, opponentCharacter } = retrieveOpponentData(
          {
            id: socket.id,
            room,
          }
        );
        if (error) return callback(error);
        
    console.log("emit startGame");
        socket.emit("startGame", { opponentName, opponentCharacter });
        
    console.log("emit to room startGame");
        socket.to(room).emit("startGame", {
          opponentName: name,
          opponentCharacter: clientCharacter,
        });
      }
    }
  });

  socket.on('getRoomLength', (room) => {
    
    console.log("on getRoomLength");
    const length = roomLength(room);
    
    console.log("emit roomLength");
    socket.emit('roomLength', length)
  });

  socket.on("joinRoom", ({ name, room }, callback) => {
    console.log("on joinRoom");
    const { error, user } = joinRoom({ id: socket.id, name, room });
    if (error) return callback(error);

    if (error) {
      console.log("error");
      console.log(error);
    } else {
      console.log(`${name} has joined ${room}`);
    }

    socket.emit("message", {
      user: "admin",
      text: `${user.name}, bienvenue !`,
    });

    socket.broadcast.to(user.room).emit("message", {
      user: "admin",
      text: `${user.name} a rejoint la partie!`,
    });

    socket.leave(socket.id);
    socket.join(user.room);
  });

  socket.on("sendMessage", ({ message, room, name }) => {
    console.log("on sendMessage");
    console.log("emit to room message");
    io.to(room).emit("message", { user: name, text: message });
  });

  // Enlève le personnage associé au joueur
  socket.on("sendEndGame", (room) => {
    console.log("on sendEndGame");
    room = room.trim().toLowerCase();
    removeRoomUsersCharacter(room);
    console.log("emit to room endGame");
    io.to(room).emit("endGame");
  });

  // Enlève la room associée au joueur
  socket.on(
    "changeRoom",
    (
      room,
      name //DEV
    ) => {
      console.log("on changeRoom");
      console.log("emit redirectToRooms");
      socket.to(room).emit("redirectToRooms");
      cleanAtRoom();
    }
  );

  socket.on("redirectedToRooms", () => {
    console.log("on redirectedToRooms");
    cleanAtRoom();
    console.log("rooms");
    console.log(Object.keys(io.sockets.adapter.rooms));
    console.log("users");
    console.log(users);
  });

  socket.on("reinitialize", (name) => {
    console.log("on reinitialize");
    if (name) {
      let userIndex = users.findIndex((user) => user.id === socket.id);
      console.log("emit to room reinitializeMe");
      socket.to(users[userIndex].room).emit("reinitilizeMe");
      console.log("leave room");
      socket.leave(users[userIndex].room);
      
    console.log("join id room");
      socket.join(socket.id);
      users[userIndex].name = "";
      users[userIndex].room = "";
      users[userIndex].character = "";
    }
  });

  const removeAllUsersFromRoom = ( room ) => {
    console.log("removeAllUsersFromRoom");
    
    console.log("leave room");
    socket.leave(room);
    
    console.log("join id room");
    socket.join(socket.id);
    console.log(users);
    let userIndex = users.findIndex((user) => user.id === socket.id);
    users[userIndex].room = socket.id;
  };

  const removeRoomUsersCharacter = (room) => {
    console.log("removeRoomUsersCharacter");
    for (i = 0; i < users.length; i++) {
      if (users[i].room === room) {
        users[i].character = "";
      }
    }
  };

  const cleanAtRoom = () => {
    // Enlève le personnage des joueurs de la salle + sors les joueurs de la salle et les fait rejoindre une salle avec leur id
    
    console.log("cleanAtRoom");
    let userIndex = users.findIndex((user) => user.id === socket.id);
    let user = users[userIndex];
    removeRoomUsersCharacter(user.room);
    removeAllUsersFromRoom(user.room);
  };
});

app.use(router);

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));
