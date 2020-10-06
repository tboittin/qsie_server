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
const addUser = ({ id, name }) => {
  name = name.trim().toLowerCase();

  const existingUser = users.find((user) => user.name === name);

  if (existingUser) {
    return { error: "Ce nom est déjà pris, veuillez en choisir un autre" };
  }

  const user = { id, name };

  return { user };
};

// Rooms
const getRooms = () => {
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
  room = room.trim().toLowerCase();

  const roomIsFull = users.filter((user) => user.room === room).length >= 2;
  if (roomIsFull) {
    return { error: "Ce salon est déjà plein, veuillez en choisir un autre" };
  }

  const user = { id, name, room };

  let i = users.findIndex((user) => user.id === id);
  users[i] = user;

  console.log(users);
  return { user };
};

// Choose Character
const addCharacter = ({ id, clientCharacter }) => {
  const userIndex = users.findIndex((user) => user.id === id);
  users[userIndex] = { ...users[userIndex], character: clientCharacter };
}; //Si ne fonctionne pas, utiliser concat

// Game
const getNbOfPlayersInRoom = (room) => {
  room = room.trim().toLowerCase();
  let chosenRoom = io.sockets.adapter.rooms[room];
  let nbOfPlayersInRooms = chosenRoom.length;
  return nbOfPlayersInRooms;
};

const retrieveOpponentData = ({ id, room }) => {
  const usersInRoom = users.filter((u) => u.room === room);
  const otherUser = usersInRoom.filter((userInRoom) => userInRoom.id !== id)[0];
  let opponentName = otherUser.name;
  let opponentCharacter = otherUser.character;
  // console.log(opponentCharacter, opponentName);
  return { opponentName, opponentCharacter };
};

// Win Screen
const removeUserFromRoom = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
  }
};

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

io.on("connection", (socket) => {
  console.log("a user connected: ", socket.id);

  socket.on("login", ({ name }, callback) => {
    const { error, user } = addUser({ id: socket.id, name });
    if (error) return callback(error);
    console.log(user);
    users.push(user);
    console.log("users: ");
    console.log(users);
  });

  socket.on("disconnect", () => {
    const user = users.filter((u) => u.id === socket.id);
    removeUser(socket.id);
    console.log("a user disconnected: ", socket.id);

    io.to(user.room).emit("message", {
      user: "admin",
      text: `${user.name} has left.`,
    });
  });

  socket.on("getRooms", () => {
    let rooms = getRooms();
    socket.emit("rooms", rooms);
  });

  socket.on("characterPicked", ({ name, clientCharacter, room }) => {
    addCharacter({ id: socket.id, room, clientCharacter });
    console.log(clientCharacter.name, "has been picked in", room, "by", name);
    // console.log(`nombre de joueurs : ${getUsersInRoom.length}`); //Changer le nombre de joueurs ici

    if (getNbOfPlayersInRoom(room) === 2) {
      let { opponentName, opponentCharacter } = retrieveOpponentData({
        id: socket.id,
        room,
      });
      socket.emit("startGame", { opponentName, opponentCharacter });
      socket
        .to(room)
        .emit("startGame", {
          opponentName: name,
          opponentCharacter: clientCharacter,
        });
    }
  });

  socket.on("joinRoom", ({ name, room }, callback) => {
    const { error, user } = joinRoom({ id: socket.id, name, room });
    if (error) return callback(error);

    if (error) {
      console.log("error");
      console.log(error);
    } else {
      console.log(`${name} has joined ${room}`);
      console.log(user);
    }

    socket.emit("message", {
      user: "admin",
      text: `${user.name}, welcome to the room ${user.room}`,
    });

    socket.broadcast
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name} has joined!` });

    socket.leave(socket.id);
    socket.join(user.room);
  });

  socket.on("sendMessage", ({ message, room, name }) => {
    io.to(room).emit("message", { user: name, text: message });
  });

  // Enlève le personnage associé au joueur
  socket.on("sendEndGame", (room) => {
    room = room.trim().toLowerCase();
    console.log("users before");
    console.log(users);
    io.to(room).emit("endGame");
    let usersInRoom = users.filter((u) => u.room === room);
    console.log("users in room");
    console.log(usersInRoom);
    for (i = 0; i < usersInRoom.length; i++) {
      let userIndex = users.findIndex((u) => (u.id = usersInRoom[i].id));
      users[userIndex].character = "";
    }
    console.log("users after");
    console.log(users);
  });

  // Enlève la room associée au joueur
  socket.on("changeRoom", () => {
    let userIndex = users.findIndex((user) => user.id === socket.id);
    socket.leave(socket.id);
    users[userIndex].room = "";
  });
});

app.use(router);

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));
