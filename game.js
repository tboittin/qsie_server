const characters = [];

const addCharacter = ({ id, room, clientCharacter }) => {
  const character = { id, clientCharacter };

  const roomIndex = characters.findIndex(
    (characterRoom) => characterRoom.room === room
  );

  if (roomIndex !== -1) {
    characters[roomIndex].characters.push(character);
  } else {
    let characterRoom = { room: room, characters: [character] };
    characters.push(characterRoom);
  }
};

const exchangeCharacters = ({ id, room }) => {
  const roomIndex = characters.findIndex(
    characterRoom => characterRoom.room === room
  );

  const otherCharacter = characters[roomIndex].characters.filter(
    character => character.id !== id
  );

  return otherCharacter;
};

module.exports = { addCharacter, exchangeCharacters };
