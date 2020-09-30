const users = [];

// Ecran Login

// // Retourne user après l'avoir ajouté dans users
const addUser = ({ id, name }) => {
  name = name.trim().toLowerCase();

  const existingUser = users.find((user) => user.name === name);

  if (existingUser) {
    return { error: "Ce nom est déjà pris, veuillez en choisir un autre" };
  }

  const user = { id, name };

  users.push(user);

  return user;
};

// Ecran Rooms

// // Retourne array rooms = [{name, numberOfPlayers}]
const getRooms = () => {
  let rooms = [];
  for (let i = 0; i < users.length; i++) {
    const existingRoomIndex = rooms.findIndex(
      (room) => room.name === users[i].room
    );
    if (existingRoomIndex !== -1) {
      rooms[existingRoomIndex].numberOfPlayers++;
    } else {
      rooms.push({ id:i, name: users[i].room, numberOfPlayers: 1 });
    }
  }
  return rooms;
};

// // Retourne user après lui avoir assigné dans users une room existante
const joinRoom = ({ id, name, room }) => {
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

// Général

// // Retourne l'user depuis users en l'identifiant par son id
const getUser = (id) => users.find((user) => user.id === id);

// // Retourne l'array users
const getUsers = () => users;

// Ecran Game

// // Retourne array usersInRoom = [{id, name, room}]
const getUsersInRoom = ( room ) => {
  let usersInRoom = users.filter((user) => user.room === room);
  
  console.log('users');
  console.log(users);
  console.log('users in room');
  console.log(usersInRoom);
  return usersInRoom;
};

// // Associe un personnage à l'user
const addCharacter = ({ id, clientCharacter }) => {
  const userIndex = users.findIndex(user => user.id === id);
  users[userIndex] = {...users[userIndex], character : clientCharacter};
}; //Si ne fonctionne pas, utiliser concat

// // récupère le personnage adverse
const retrieveOpponentData = ({ id, room }) => {
  const usersInRoom = getUsersInRoom(room);

  const otherUser = usersInRoom.filter(
    userInRoom => userInRoom.id !== id
  );
  let opponentName = otherUser.name;
  let opponentCharacter = otherUser.character;
  return ({opponentName, opponentCharacter});
};

// WinScreen

// //
const removeUserFromRoom = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
  }
};

// A la déconnexion

// // Supprime un user de users
const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

module.exports = {
  users,
  addUser,
  getRooms,
  joinRoom,
  getUser,
  getUsers,
  getUsersInRoom,
  removeUser,
  removeUserFromRoom,
  addCharacter,
  retrieveOpponentData,
};
