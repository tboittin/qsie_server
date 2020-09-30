const express = require("express");
const socketio = require("socket.io");

const http = require("http");
const cors = require("cors");

const {
  addUser,
  removeUser,
  getUser,
  getUsers,
  getUsersInRoom,
  joinRoom,
  addCharacter,
  retrieveOpponentData,
} = require("./users");

const PORT = process.env.PORT || 5000;

const router = require("./router");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(router);
app.use(cors());

const getRooms = () => {
  let rooms = [];
  let greenRoom = io.sockets.adapter.rooms["green room"];
  let roomsLength = Object.keys(io.sockets.adapter.rooms).length;

  for (i = 0; i < roomsLength; i++) {
    console.log("i = " + i);
    let nbOfPlayersInRoom = Object.values(io.sockets.adapter.rooms)[i].length;
    if (nbOfPlayersInRoom === 1) {
      let roomsName = Object.keys(io.sockets.adapter.rooms)[i];
      let roomsId = Object.keys(
        Object.values(io.sockets.adapter.rooms)[i].sockets
      )[0];
      let room = { id: roomsId, name: roomsName };
      console.log(
        `is roomsId (${room.id}) different than room.name (${room.name}): ${
          room.id !== room.name
        }`
      );
      if (room.id !== room.name) {
        rooms.push(room);
      }
    }
  }
  return rooms;
};

io.on("connection", (socket) => {
  console.log("a user connected: ", socket.id);

  socket.on("login", ({ name }, callback) => {
    const { error, user } = addUser({ id: socket.id, name }); // TODO faire en sorte de bloquer quand il y a le même nom
    if (error) return callback(error);
    // io.emit("users", {
    //   users: getUsers(),
    // });
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    console.log("a user disconnected: ", socket.id);

    if (user) {
      io.to(user.room).emit("message", {
        user: "admin",
        text: `${user.name} has left.`,
      });
    }
  });

  socket.on("getRooms", () => {
    let rooms = getRooms();
    socket.emit("rooms", rooms);
  });

  socket.on("characterPicked", ({ clientCharacter, room }) => {
    addCharacter({ id: socket.id, room, clientCharacter });
    console.log(clientCharacter.name + " has been picked in " + room);
    // console.log(`nombre de joueurs : ${getUsersInRoom.length}`); //Changer le nombre de joueurs ici

    if (getUsersInRoom.length === 2) {
      let({ opponentName, opponentCharacter }) = retrieveOpponentData({
        id: socket.id,
        room,
      });
      io.in(room).emit("startGame", { opponentName, opponentCharacter });
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

    // io.to(room).emit("usersinRoom", {
    //   usersInRoom: getUsersInRoom(room)
    // });

    getRooms();
  });

  socket.on("sendMessage", ({ message, room, name }) => {
    io.to(room).emit("message", { user: name, text: message });
  });

  // Enlève le personnage associé au joueur
  socket.on("sendEndGame", (room) => {
    io.to(room).emit("endGame");
    let usersInRoom = getUsersInRoom(room);
    for (i = 0; i <= usersInRoom.length; i++) {
      let userIndex = users.findIndex(usersInRoom[i]);
      users[userIndex] = { ...rest, character: "" };
    }
  });

  // Enlève la room associée au joueur
  socket.on("changeRoom", () => {
    let userIndex = users.findIndex((user) => id === socket.id);
    users[userIndex].room = "";
  });
});

app.use(router);

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));
