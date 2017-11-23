'use strict';

const helper = {};
const accountService = require('../../api/im/accountService');
const result = require('../../common/result');
const logger = require('../../common/log')('error');
const loginMiddleware = require('../../middleware/login');

const getRoomName = function (name, type) {
  return `${type}_${name}`;
};

/**
 * 验正用户是否登录，以及获取用户的信息
 * @param socket
 * @param next
 */
helper.login = function(socket, next) {
  const rs = loginMiddleware.webSocketMiddleware(socket);
  console.log('login --->', rs);

  if (rs.status === '0') {
    const data = rs.data;
    socket.info = data.info;
    next();
  } else {
    socket.emit('error', rs);
    socket.disconnect();
  }
};

helper.getRoomNameByUserId = function setRoomNameByUserId(userId) {
  return getRoomName(userId, 'userId');
};

/**
 * 用户连接过来，确保此连接放到对应的用户房间里
 * @param ns 命名空间实例
 * @param socket
 * @param userId
 * @param successFn
 */
helper.ensureInRoom = function joinRoom(ns, socket, userId, successFn) {
  const userRoomName = helper.getRoomNameByUserId(userId);

  ns.adapter.clients([userRoomName], (err, clients) => {
    console.log('clients-->', clients, socket.id, socket.info);

    //当前socket没有在用户的房间里
    if(clients.indexOf(socket.id) === -1) {
      accountService.login(userId, (err, doc) => {
        if (err) {
          socket.emit('login', result.fail(err));
          socket.disconnect();
          return false;
        }

        ns.adapter.remoteJoin(socket.id, userRoomName, (err) => {
          if (err) {
            console.log('remote join error -->', err);
            logger.error(err.message);
            socket.emit('login', result.fail('unknown socket id, join room fail.'));
            socket.disconnect();
            return false;
          }

          socket.accountInfo = doc;
          socket.emit('login', result.success(socket.accountInfo));

          console.log('join -->', socket.accountInfo.name);

          return successFn && successFn();
        });

      });
    }else {
      socket.emit('login', result.success(socket.accountInfo));
      return successFn && successFn();
    }
  });

};

helper.logout = function (ns, socket) {
  const userRoomName = helper.getRoomNameByUserId(socket.info.userId);
  ns.adapter.remoteLeave(socket.id, userRoomName, (err) => {
    if (err) {
      console.log('out err -->', err);

      logger.error(err.message);
      socket.emit('login', result.fail('unknown socket id, leave room fail.'));
      socket.disconnect();

      return false;
    }

    console.log('out -->', socket.accountInfo.name);

    socket.emit('logout', result.success('ok'));
  });
};

module.exports = helper;
