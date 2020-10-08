"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var express = require("express");

var socketio = require("socket.io");

var http = require("http");

var cors = require("cors");

var PORT = process.env.PORT || 5000;

var router = require("./router");

var app = express();
var server = http.createServer(app);
var io = socketio(server);
app.use(router);
app.use(cors());
var users = []; // Join

var addUser = function addUser(_ref) {
  var id = _ref.id,
      name = _ref.name;
  name = name.trim().toLowerCase();
  var existingUser = users.find(function (user) {
    return user.name === name;
  });

  if (existingUser) {
    return {
      error: "Ce nom est déjà pris, veuillez en choisir un autre"
    };
  }

  var user = {
    id: id,
    name: name
  };
  return {
    user: user
  };
}; // Rooms


var getRooms = function getRooms() {
  var rooms = [];
  var roomsLength = Object.keys(io.sockets.adapter.rooms).length;

  for (i = 0; i < roomsLength; i++) {
    var nbOfPlayersInRooms = Object.values(io.sockets.adapter.rooms)[i].length;

    if (nbOfPlayersInRooms === 1) {
      var roomsName = Object.keys(io.sockets.adapter.rooms)[i];
      var roomsId = Object.keys(Object.values(io.sockets.adapter.rooms)[i].sockets)[0];
      var room = {
        id: roomsId,
        name: roomsName
      };

      if (room.id !== room.name) {
        rooms.push(room);
      }
    }
  }

  return rooms;
};

var joinRoom = function joinRoom(_ref2) {
  var id = _ref2.id,
      name = _ref2.name,
      room = _ref2.room;
  room = room.trim().toLowerCase();
  var roomIsFull = users.filter(function (user) {
    return user.room === room;
  }).length >= 2;

  if (roomIsFull) {
    return {
      error: "Ce salon est déjà plein, veuillez en choisir un autre"
    };
  }

  var user = {
    id: id,
    name: name,
    room: room
  };
  var i = users.findIndex(function (user) {
    return user.id === id;
  });
  users[i] = user;
  return {
    user: user
  };
}; // Choose Character


var addCharacter = function addCharacter(_ref3) {
  var id = _ref3.id,
      clientCharacter = _ref3.clientCharacter;
  var userIndex = users.findIndex(function (user) {
    return user.id === id;
  });
  users[userIndex] = _objectSpread({}, users[userIndex], {
    character: clientCharacter
  });
}; // Game


var getNbOfPlayersInRoom = function getNbOfPlayersInRoom(room) {
  room = room.trim().toLowerCase();
  var chosenRoom = io.sockets.adapter.rooms[room];
  var nbOfPlayersInRooms = chosenRoom.length;
  return nbOfPlayersInRooms;
};

var retrieveOpponentData = function retrieveOpponentData(_ref4) {
  var id = _ref4.id,
      room = _ref4.room;
  var usersInRoom = users.filter(function (u) {
    return u.room === room;
  });
  var otherUser = usersInRoom.filter(function (userInRoom) {
    return userInRoom.id !== id;
  })[0];
  var opponentName = otherUser.name;
  var opponentCharacter = otherUser.character;
  return {
    opponentName: opponentName,
    opponentCharacter: opponentCharacter
  };
}; // Win Screen


var removeUser = function removeUser(id) {
  var index = users.findIndex(function (user) {
    return user.id === id;
  });

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

var cleanRoom = function cleanRoom(room) {
  for (i = 0; i < users.length; i++) {
    if (users[i].room === room) {
      users[i].character = "";
    }
  }
};

io.on("connection", function (socket) {
  console.log("a user connected: ", socket.id);
  socket.on("login", function (_ref5, callback) {
    var name = _ref5.name;
    console.log("a user connected: ", socket.id);

    var _addUser = addUser({
      id: socket.id,
      name: name
    }),
        error = _addUser.error,
        user = _addUser.user;

    if (error) return callback(error);
    users.push(user);
  });
  socket.on("disconnect", function () {
    var user = users.filter(function (u) {
      return u.id === socket.id;
    })[0];

    if (user) {
      console.log("a user disconnected: ", socket.id);
      socket.broadcast.to(user.room).emit("message", {
        user: "admin",
        text: "".concat(user.name, " a quitt\xE9 la partie!")
      });
      cleanRoom(user.room);
      io.to(user.room).emit("endGame");
      io.to(user.room).emit("redirectToRooms");
      removeUser(socket.id);
    }
  });
  socket.on("getRooms", function () {
    var rooms = getRooms();
    socket.emit("rooms", rooms);
  });
  socket.on("characterPicked", function (_ref6) {
    var name = _ref6.name,
        clientCharacter = _ref6.clientCharacter,
        room = _ref6.room;
    addCharacter({
      id: socket.id,
      room: room,
      clientCharacter: clientCharacter
    });
    console.log(clientCharacter.name, "has been picked in", room, "by", name);

    if (room) {
      if (getNbOfPlayersInRoom(room) === 2) {
        var _retrieveOpponentData = retrieveOpponentData({
          id: socket.id,
          room: room
        }),
            opponentName = _retrieveOpponentData.opponentName,
            opponentCharacter = _retrieveOpponentData.opponentCharacter;

        socket.emit("startGame", {
          opponentName: opponentName,
          opponentCharacter: opponentCharacter
        });
        socket.to(room).emit("startGame", {
          opponentName: name,
          opponentCharacter: clientCharacter
        });
      }
    }
  });
  socket.on("joinRoom", function (_ref7, callback) {
    var name = _ref7.name,
        room = _ref7.room;

    var _joinRoom = joinRoom({
      id: socket.id,
      name: name,
      room: room
    }),
        error = _joinRoom.error,
        user = _joinRoom.user;

    if (error) return callback(error);

    if (error) {
      console.log("error");
      console.log(error);
    } else {
      console.log("".concat(name, " has joined ").concat(room));
    }

    socket.emit("message", {
      user: "admin",
      text: "".concat(user.name, ", bienvenue !")
    });
    socket.broadcast.to(user.room).emit("message", {
      user: "admin",
      text: "".concat(user.name, " a rejoint la partie!")
    });
    socket.leave(socket.id);
    socket.join(user.room);
  });
  socket.on("sendMessage", function (_ref8) {
    var message = _ref8.message,
        room = _ref8.room,
        name = _ref8.name;
    io.to(room).emit("message", {
      user: name,
      text: message
    });
  }); // Enlève le personnage associé au joueur

  socket.on("sendEndGame", function (room) {
    room = room.trim().toLowerCase();
    cleanRoom(room);
    io.to(room).emit("endGame");
  }); // Enlève la room associée au joueur

  socket.on("changeRoom", function (room) {
    var userIndex = users.findIndex(function (user) {
      return user.id === socket.id;
    });
    var user = users[userIndex];
    socket.leave(room);
    user.room = user.id;
    socket.join(user.id);
    console.log(user, "has joined", user.room);
    socket.to(room).emit("redirectToRooms");
  });
  socket.on("redirectedToRooms", function (room) {
    socket.leave(room);
  });
});
app.use(router);
server.listen(PORT, function () {
  return console.log("Server has started on port ".concat(PORT));
});