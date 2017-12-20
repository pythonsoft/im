'use strict';

const result = require('../../common/result');
const sessionService = require('../../api/im/sessionService');
const contactService = require('../../api/im/contactService');
const activityService = require('../../api/im/activityService');
const messageService = require('../../api/im/messageService');
const accountService = require('../../api/im/accountService');
const helper = require('./helper');

const ContactInfo = require('../../api/im/contactInfo');

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

// 获取最近会话人
service.getRecentContactList = function getRecentContactList(socket, query) {
  const page = query.page;
  const fieldNeeds = query.fieldsNeed;

  sessionService.getRecentContactList(socket.info.userId, page, 30, fieldNeeds, '-modifyTime', (err, docs) => {
    socket.emit('getRecentContactList', json(err, docs, query._cid));
  });
};

// 添加人，群，盒子到通讯录
service.addContact = function (socket, query) {
  contactService.add(query.info, socket.info.userId, (err, r) => {
    socket.emit('addContact', json(err, r, query._cid));
  });
};

//获取通讯录列表
service.listContact = function(socket, query) {
  contactService.list(query.ownerId, query.type, (err, docs) => {
    if(err) {
      return socket.emit('listContact', errorJSON(err, query._cid));
    }

    const len = docs.length;

    if(len === 0) {
      return socket.emit('listContact', json(err, docs, query._cid));
    }

    const sessionIds = [];
    let temp = null;

    for(let i = 0; i < len; i++) {
      temp = docs[i];
      docs[i].sessionInfo = {};

      if(temp.type === ContactInfo.TYPE.NORMAL_GROUP) {
        sessionIds.push(temp.targetId);
      }

    }

    if(sessionIds.length === 0) {
      return socket.emit('listContact', json(err, docs, query._cid));
    }

    sessionService.getSession(sessionIds, (err, sDocs) => {
      if (err) {
        return socket.emit('listContact', errorJSON(err, query._cid));
      }

      for (let i = 0, l = sDocs.length; i < l; i++) {
        for(let j = 0; j < len; j++) {
          if(sDocs[i]._id === docs[j].targetId) {
            docs[j].sessionInfo = sDocs[i];
          }
        }
      }

      socket.emit('listContact', json(err, docs, query._cid));
    });

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
service.message = function (socket, query, ns) {
  /**
   * const query = {
   *    sessionId: '',
   *    content: '',
   *    fromId: '',
   *    toId: '',
   *    toType: '',
   *    type: '',
   *    _cid: '',
   *    details: {},
   * }
   */
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
      members,
      details: query.details || {},
    }, (err, info) => {
      if (err) {
        return socket.emit('message', errorJSON(err, query._cid));
      }

      // helper.roomExist(ns,userId);
      for (let i = 0, len = members.length; i < len; i++) {
        ns.to(helper.getRoomNameByUserId(members[i]._id)).emit('message',successJSON(info,query._cid));
      }

    });
  });
};

// 通过关键字检索找到用户
service.searchUser = function (socket, query)  {
  accountService.list(query.keyword,query.page=1, query.pageSize=20, query.sortFields='-createdTime', query.fieldNeeds, (err, rs) => {
    socket.emit('searchUser', json(err, rs, query._cid));
  })
};

// 找到两个ID的共有会话
service.getSessionByUserIdAtC2C = function getSessionByUserIdAtC2C(socket,query) {
  sessionService.getSessionByUserIdAtC2C(query.ownerId,query.targetId,(err, rs) => {
    socket.emit('getSessionByUserIdAtC2C',json(err, rs, query._cid));
  })
};

// 删除好友
service.deleteContact = function deleteContact(socket,query) {
  contactService.delete(query.ownerId,query.targetId,query.type,(err, rs) => {
    socket.emit('deleteContact',json(err, rs, query._cid));
  })
};

//获取session信息
service.getSessionInfo = function (socket, query) {
  sessionService.getSession(query.sessionId,(err, rs) => {
    socket.emit('getSessionInfo',json(err, rs, query._cid));
  })
};

//获取历史消息
service.listStorage = function (socket, query) {
  messageService.list(query.sessionId, query.page, query.pageSize || 10 , false , (err, docs) => {
    socket.emit('listStorage', json(err, docs, query._cid));
  })
};

// 用户删除一个会话时，将用户从这个上会话移除
service.leaveSession = function (socket, query) {
  sessionService.leaveSession(query.sessionId, query.userId, (err, docs) => {
    socket.emit('leaveSession',json(err, docs, query._cid));
  })
};

//删除一个会话
service.deleteSession =function (socket, query) {
  sessionService.deleteSession(query.sessionId, query.creatorId, (err, docs) => {
    socket.emit('deleteSession',json(err, docs, query._cid));
  });
};

//添加星标联系人
service.setOnTopSession = function (socket, query) {
  sessionService.setOnTopSession( query.sessionId, (err, docs) => {
    socket.emit('setOnTopSession',json(err, docs, query._cid));
  })
};

//获取星标联系人列表
service.listOnTopSession = function ( socket, query ) {
  sessionService.listOnTopSession(query.ownerId, query.page, query.pageSize, false, 'createdTime', (err, docs) => {
    socket.emit('listOnTopSession', json(err, docs, query._cid));
  });
};

module.exports = service;

