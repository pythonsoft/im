/**
 * Created by chaoningxie on 2017/11/12.
 */
const utils = require('../../common/utils');

const result = require('../../common/result');
const helper = require('./helper');
const service = require('./service');

class ChatIO {
  constructor(io) {
    const chatIO = io.of('/chat');

    chatIO.use(helper.login);

    chatIO.on('connection', (socket) => {
      console.log('connection -->', socket);
      utils.console('connection.socket.id', socket.id);
      utils.console('connection.info', socket.info);

      const userId = socket.info.userId;

      // 确保当前连接放到登录用户的房间内
      helper.ensureInRoom(chatIO, socket, userId, () => {
        for (const k in service) {
          socket.on(k, (q) => {
            service[k](socket, q);
          });
        }

        socket.on('error', (err) => {
          utils.console(`socket error socket id: ${socket.id}`, err);
          socket.emit('error', err.message);
          socket.disconnect();
        });

        socket.on('disconnect', () => {
          utils.console(`disconnect with client :${socket.id}`);
          // helper.logout(chatIO, socket);
        });
      });
    });
  }
}

module.exports = ChatIO;

