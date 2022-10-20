const IO = require('socket.io');
// const io = require("socket.io")(8900, {
// cors: {
//   origin: "http://localhost:3000",
// },
// });
let users = [];

const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

let index = (server) => {
  try {
    const io = IO(server, {
      cors: {
        origin: 'http://localhost:3000',
      },
    });
    console.log('socket run');

    io.on('connection', (socket) => {
      //when ceonnect
      console.log('a user connected.');

      //take userId and socketId from user
      socket.on('addUser', (userId) => {
        addUser(userId, socket.id);
        io.emit('getUsers', users);
      });

      //send and get message
      socket.on(
        'sendMessage',
        ({ senderId, receiverId, conversationId, text }) => {
          const user = getUser(receiverId);
          console.log('user', user);
          if (!user) {
            //user offline
            return;
          }
          io.to(user.socketId).emit('getMessage', {
            senderId,
            text,
            conversationId,
          });
        }
      );

      //when disconnect
      socket.on('disconnect', () => {
        console.log('a user disconnected!');
        removeUser(socket.id);
        io.emit('getUsers', users);
      });
    });
  } catch (err) {
    console.log(err);
  }
};
module.exports = index;
