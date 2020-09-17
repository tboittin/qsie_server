const express = require('express');
const socketio = require('socket.io');

const http = require('http');
const cors = require('cors');

const { addUser, removeUser, getUser, getUsersInRoom, getRooms, joinRoom } = require('./users');
const { addCharacter, exchangeCharacters } = require('./game');

const PORT = process.env.PORT || 5000;

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(router);
app.use(cors());

io.on('connection', socket => {

    socket.on('login', ({name}, callback) => {
        const { error, user } = addUser({ id: socket.id, name});
        if(error) return callback(error);

        callback();
    });

    socket.on('getRooms', (callback) => {
        const {rooms} = getRooms();
        callback();
    })

    socket.on('joinRoom', ({name, room}, callback) => {
        const { error, user } = joinRoom({ id: socket.id, name, room});
        if(error) return callback(error);

        socket.emit('message', {user: 'admin', text: `${user.name}, welcome to the room ${user.room}`});

        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!`});

        socket.join(user.room);

        io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});

        callback();
    });

    socket.on('createRoom', ({name, room}, callback) => {
        const { error, user } = addRoom({ id: socket.id, name, room});
        if(error) return callback(error);

        socket.emit('message', {user: 'admin', text: `${user.name}, welcome to the room ${user.room}`});

        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!`});

        socket.join(user.room);

        io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});

        callback();
    });
    
    socket.on('sendMessage', (message, callback) => {

        const user = getUser(socket.id);

        io.to(user.room).emit('message', {user: user.name, text: message});
        io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});

        callback();
    });

    socket.on('exchange character', ({room, clientCharacter}, callback) => {
        // add character
        addCharacter({ id: socket.id, room, clientCharacter})

        // listen to players both chosing characters

        // exchange character
        const opponentCharacter = exchangeCharacters({id: socket.id, room})

        callback();
    });

    socket.on('endGame', () => {
        // listen if one of players wins & send signal to loser to get redirected
    });

    socket.on('replay', () => {
        // 
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user){
            io.to(user.room).emit('message', {user: 'admin', text: `${user.name} has left.`})
        }
    });
})

app.use(router);

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));