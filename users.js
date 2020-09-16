const users = [];

// Ecran Login

// // Retourne user après l'avoir ajouté dans users
const addUser = ({id, name}) => {
    name = name.trim().toLowerCase();
    
    const existingUser = users.find(user => user.name === name);

    if(existingUser) {
        return { error: 'Ce nom est déjà pris, veuillez en choisir un autre'};
    };

    const user = {id, name};

    users.push(user);

    return {user};
};

// Ecran Rooms

// // Retourne array rooms = [{name, numberOfPlayers}]
const getRooms = () => {
    let rooms = [];
    for (let i = 0; i < users.length ; i++) {
        const existingRoomIndex = rooms.find(room => room.name === users[i].room)
        if (existingRoomIndex !== undefined) {
            rooms[existingRoomIndex].numberOfPlayers ++;
        } else {
            rooms.push({name:users[i].room, numberOfPlayers : 1});
        };
    };
    return rooms;
};

// // Retourne user après lui avoir assigné dans users une nouvelle room 
const addRoom = ({id, name, room}) => {
    room = room.trim().toLowerCase();

    const existingRoom = users.find(user => user.room === room);

    if (existingRoom) {
        return {error: 'Une salle portant ce nom existe déjà, veuillez en choisir un autre'};
    }

    const user = {id, name, room};
    
    let i = users.find(user => user.id === id);

    users[i] = user;

    return {user};
};

// // Retourne user après lui avoir assigné dans users une room existante 
const joinRoom = ({id, name, room}) => {
    room = room.trim().toLowerCase();

    const roomIsFull = users.filter(user => user.room === room).length >= 2;

    if (roomIsFull) {
        return {error: 'Ce salon est déjà plein, veuillez en choisir un autre'};
    }
    
    const user = {id, name, room};
    
    let i = users.find(user => user.id === id);

    users[i] = user;

    return {user};
};


// Général

// // Retourne l'index de user dans users en l'identifiant par son id
const getUser = (id) => users.find((user) => user.id === id);

// Ecran Game

// // Retourne array usersInRoom = [{id, name, room}]
const getUsersInRoom = ({room}) => {
    let usersInRoom = users.filter((user) => user.room === room)
    return usersInRoom;
};

// A la déconnexion

// // Supprime un user de users
const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id);

    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
};

module.exports = { addUser, getRooms, addRoom, joinRoom, getUser, getUsersInRoom, removeUser};