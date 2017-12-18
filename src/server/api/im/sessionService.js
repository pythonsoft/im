/**
 * Created by chaoningx on 2017/9/22.
 */

'use strict';

const logger = require('../../common/log')('error');
const utils = require('../../common/utils');
const uuid = require('uuid');
const i18n = require('i18next');
const accountService = require('./accountService');

const SessionInfo = require('./sessionInfo');

const sessionInfo = new SessionInfo();

const service = {};

// 列出含有userId的会话列表
service.getRecentContactList = function getRecentContactList(userId, page = 1, pageSize = 50, fieldNeeds, sort = '-modifyTime', cb) {
  if (!userId) {
    return cb && cb(i18n.t('imSessionFieldsIsNull', { field: 'userId' }));
  }

  sessionInfo.pagination({ 'members._id': userId }, page, pageSize, (err, docs) => {
    if (err) {
      logger.error(err.message);
      return cb && cb(i18n.t('databaseError'));
    }

    return cb && cb(null, docs);
  }, sort, fieldNeeds);
};

service.createSession = function createSession(creatorId, info, cb) {
  if (!creatorId) {
    return cb && cb(i18n.t('imSessionFieldsIsNull', { field: 'creatorId' }));
  }

  if (utils.isEmptyObject(info)) {
    return cb && cb(i18n.t('imSessionFieldsIsNull', { field: 'info' }));
  }

  const sInfo = utils.merge({
    name: '',
    type: '',
    members: '',
  }, info);

  sInfo._id = uuid.v1();
  const t = new Date();
  sInfo.createdTime = t;
  sInfo.modifyTime = t;
  sInfo.creatorId = creatorId;

  if (!sInfo.name) {
    return cb && cb(i18n.t('imSessionFieldsIsNull', { field: 'name' }));
  }

  if (!sInfo.members) {
    return cb && cb(i18n.t('imSessionFieldsIsNull', { field: 'members' }));
  }

  if (!sInfo.type || !utils.isValueInObject(sInfo.type, SessionInfo.TYPE)) {
    return cb && cb(i18n.t('imSessionFieldsIsNull', { field: 'type' }));
  }

  accountService.getUsers(sInfo.members, (err, users) => {
    if (err) {
      return cb && cb(err);
    }

    sInfo.members = users;

    sessionInfo.insertOne(sInfo, (err) => {
      if (err) {
        return cb && cb(err);
      }

      return cb && cb(null, sInfo);
    });
  });
};

service.addUserToSession = function addUserToSession(sessionId, userId, cb) {
  if (!sessionId) {
    return cb && cb(i18n.t('imSessionFieldsIsNull', { field: 'sessionId' }));
  }

  if (!userId) {
    return cb && cb(i18n.t('imSessionFieldsIsNull', { field: 'userId' }));
  }

  sessionInfo.collection.findOne({ _id: sessionId }, { fields: { _id: 1, members: 1 } }, (err, session) => {
    if (err) {
      logger.error(err.message);
      return cb && cb(i18n.t('databaseError'));
    }

    if (!session) {
      return cb && cb(i18n.t('imSessionIsNotExist'));
    }

    for (let i = 0, len = session.members.length; i < len; i++) {
      if (session.members[i]._id === userId) {
        return cb && cb(i18n.t('imMemberHasBeenSession'));
      }
    }

    accountService.getUsers(userId, (err, docs) => {
      if (err) {
        return cb && cb(err);
      }

      if (docs && docs.length === 0) {
        return cb && cb(i18n.t('imMemberIsNotExist'));
      }

      sessionInfo.collection.updateOne({ _id: sessionId }, { $push: { members: docs[0] } }, (err, r) => {
        if (err) {
          logger.error(err.message);
          return cb && cb(i18n.t('databaseError'));
        }

        return cb && cb(null, r);
      });
    });
  });
};

// 用户删除一个会话时，将用户从这个上会话移除
service.leaveSession = function (sessionId, userId, cb) {
  if (!sessionId) {
    return cb && cb(i18n.t('imSessionFieldsIsNull', { field: 'sessionId' }));
  }

  if (!userId) {
    return cb && cb(i18n.t('imSessionFieldsIsNull', { field: 'userId' }));
  }

  sessionInfo.collection.updateOne({ _id: sessionId }, { $pull: { 'members._id': userId } }, (err, r) => {
    if (err) {
      logger.error(err.message);
      return cb && cb(i18n.t('databaseError'));
    }

    return cb && cb(null, r);
  });
};

service.getSession = function getSession(sessionId, cb) {
  if (!sessionId) {
    return cb && cb(i18n.t('imSessionFieldsIsNull', { field: 'sessionId' }));
  }

  sessionInfo.collection.findOne({ _id: sessionId }, (err, doc) => {
    if (err) {
      logger.error(err.message);
      return cb && cb(i18n.t('databaseError'));
    }

    if (!docs) {
      return cb && cb(i18n.t('imSessionIsNotExist'));
    }

    return cb && cb(null, doc);
  });
};

/**
 * 找到这两个ID共有的会话，仅支持私聊模式，应用场景：在通讯录里边点好友头像，发起聊天，须找到两个人曾经有过的会话。
 * @param meId
 * @param targetId
 * @param cb
 * @returns {*}
 */
service.getSessionByUserIdAtC2C = function getSessionByUserIdAtC2C(meId, targetId, cb) {
  if (!targetId) {
    return cb && cb(i18n.t('imSessionFieldsIsNull', { field: 'targetId' }));
  }

  sessionInfo.collection.findOne({
    type: SessionInfo.TYPE.C2C,
    'members._id': { $all: [meId, targetId] },
  }, (err, doc) => {
    if (err) {
      logger.error(err.message);
      return cb && cb(i18n.t('databaseError'));
    }

    if (!doc) {
      return cb && cb(i18n.t('imSessionIsNotExist'));
    }

    return cb && cb(null, doc);
  });
};

module.exports = service;
