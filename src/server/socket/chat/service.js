'use strict';

const result = require('../../common/result');
const sessionService = require('../../api/im/sessionService');
const contactService = require('../../api/im/contactService');
const activityService = require('../../api/im/activityService');
const messageService = require('../../api/im/messageService');
const helper = require('./helper');

const service = {};

const json = function (err, r, cid) {
  let rs = '';

  if (err) {
    rs = errorJSON(err, cid);
  } else {
    rs = successJSON(r, cid);
  }

  return rs;
};

const errorJSON = function (err, cid) {
  return result.fail(err, {}, cid);
};

const successJSON = function (doc, cid) {
  return result.success(doc, 'ok', cid);
};

// 获取最近会话
service.getRecentContactList = function getRecentContactList(socket, query) {
  const page = query.page;
  const fieldNeeds = query.fieldsNeed;

  sessionService.getRecentContactList(socket.info.userId, page, 30, fieldNeeds, '-modifyTime', (err, docs) => {
    socket.emit('getRecentContactList', json(err, docs, query._cid));
  });
};

// 添加人，群，盒子到通讯录
service.addContact = function (socket, query) {
  contactService.add({
    targetId: query.targetId,
    targetName: query.targetName,
    photo: query.photo || '',
    type: query.type,
    fromWhere: query.fromWhere || 'web',
    details: query.details || {},
  }, socket.info.userId, (err, r) => {
    socket.emit('addContact', json(err, r, query._cid));
  });
};

// 创建新的会话。
service.createSession = function createSession(socket, query) {
  sessionService.createSession(socket.info.userId, {
    name: query.name,
    type: query.type,
    members: query.members,
  }, (err, r) => {
    socket.emit('createSession', json(err, r, query._cid));
  });
};

// 将一个人添加到现有点的会话中
service.addUserToSession = function addUserToSession(socket, query) {
  sessionService.addUserToSession(query.sessionId, query.userId, (err, r) => {
    socket.emit('addUserToSession', json(err, r, query._cid));
  });
};

// 列出未读的消息，支持分页及seq
service.listUnReadMessage = function (socket, query) {
  activityService.getActivity(socket.info.userId, query.sessionId, (err, doc) => {
    if (err) {
      return socket.emit('listUnReadMessage', errorJSON(err, query._cid));
    }

    const seq = doc ? doc.seq : 0;

    messageService.listBySeq(query.sessionId, seq, query.page, query.pageSize || 10, false, (err, docs) => {
      socket.emit('listUnReadMessage', json(err, docs, query._cid));
    });
  });
};

// 将session中已读的最后一条消息的seq记录，标识该用户在这个session中读到了哪条信息
service.hasRead = function (socket, query) {
  activityService.setSeq(socket.info.userId, query.sessionId, query.seq, (err, r) => {
    socket.emit('listUnReadMessage', json(err, r, query._cid));
  });
};

// 发送消息
service.message = function (socket, query) {
  sessionService.getSession(query.sessionId, (err, session) => {
    if (err) {
      return socket.emit('message', errorJSON(err, query._cid));
    }

    const content = query.content || '';
    const members = session.members || [];

    messageService.add({
      from: { _id: query.fromId, type: query.fromType },
      to: { _id: query.toId, type: query.toType },
      sessionId: session._id,
      type: query.type,
      content,
      details: query.details || {},
    }, (err, info) => {
      if (err) {
        return socket.emit('message', errorJSON(err, query._cid));
      }

      let rooms = null;

      for (let i = 0, len = members.length; i < len; i++) {
        rooms = socket.to(helper.getRoomNameByUserId(members[i]._id));
      }

      if (rooms) {
        rooms.emit('message', successJSON(info, query._cid));
      } else {
        // 如果为空，不需要调用emit返回任何东西
      }
    });
  });
};

module.exports = service;
