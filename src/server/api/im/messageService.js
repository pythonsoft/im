const logger = require('../../common/log')('error');
const utils = require('../../common/utils');
const uuid = require('uuid');
const i18n = require('i18next');

const ContactInfo = require('./contactInfo');

const MessageInfo = require('./messageInfo');

const messageInfo = new MessageInfo();

const service = {};

service.add = function (info, cb) {
  if (!utils.isEmptyObject(info)) {
    return cb && cb(i18n.t('imMessageFieldsIsNull', { field: 'info' }));
  }

  const mInfo = utils.merge({
    from: { _id: '', type: '' },
    to: { _id: '', type: '' },
    sessionId: '',
    type: '',
    content: '',
    details: {}
  }, info);

  info._id = uuid.v1();
  info.createTime = new Date();

  if(!mInfo.sessionId && mInfo.sessionId !== 36) {
    return cb && cb(i18n.t('imMessageFieldsIsInvalid', { field: 'sessionId' }));
  }

  if(typeof mInfo.content !== 'string') {
    return cb && cb(i18n.t('imMessageFieldsIsInvalid', { field: 'content' }));
  }

  mInfo.content = mInfo.content.trim();

  if(!mInfo.content) {
    return cb && cb(i18n.t('imMessageContentIsNull'));
  }

  if(!mInfo.content.length > 1000) {
    return cb && cb(i18n.t('imMessageContentTooLong'));
  }

  if(!mInfo.from || utils.isEmptyObject(mInfo.from) || mInfo.from._id.length !== 36 || !mInfo.from || utils.isValueInObject(mInfo.from.type, ContactInfo.TYPE)) {
    return cb && cb(i18n.t('imMessageFieldsIsNull', { field: 'from' }));
  }

  if(!mInfo.to || utils.isEmptyObject(mInfo.from) || mInfo.to._id.length !== 36 || !mInfo.to || utils.isValueInObject(mInfo.to.type, ContactInfo.TYPE)) {
    return cb && cb(i18n.t('imMessageFieldsIsNull', { field: 'to' }));
  }

  if(utils.isValueInObject(mInfo.type, MessageInfo.TYPE)) {
    return cb && cb(i18n.t('imMessageTypeIsNotExist'));
  }

  messageInfo.findOneAndUpdate(mInfo, { $inc: { seq: 1 } }, { upsert: true }, (err, r) => {
    if (err) {
      logger.error(err.message);
      return cb && cb(i18n.t('databaseError'));
    }

    return cb && cb(null, mInfo);
  });

};

service.list = function (sessionId, page, pageSize, fieldNeeds, cb) {
  if (!sessionId) {
    return cb && cb(i18n.t('imMessageFieldsIsNull', { field: 'sessionId' }));
  }

  messageInfo.pagination({ sessionId }, page, pageSize, (err, docs) => {
    if (err) {
      logger.error(err.message);
      return cb && cb(i18n.t('databaseError'));
    }

    return cb && cb(null, docs);
  }, '-createdTime', fieldNeeds);
};

service.listBySeq = function (sessionId, seq, page=1, pageSize=10, fieldNeeds, cb) {
  if (!sessionId) {
    return cb && cb(i18n.t('imMessageFieldsIsNull', { field: 'sessionId' }));
  }

  if (seq !== 0 && !seq) {
    return cb && cb(i18n.t('imMessageFieldsIsNull', { field: 'seq' }));
  }

  const q = {
    sessionId: sessionId
  };

  if(seq) {
    q.seq = { $lte: seq };
  };

  messageInfo.pagination(q, page, pageSize, (err, docs) => {
    if (err) {
      logger.error(err.message);
      return cb && cb(i18n.t('databaseError'));
    }

    return cb && cb(null, docs);
  }, '-createdTime', fieldNeeds);

};

service.getDetail = function (_id, fields, cb) {
  if (!_id) {
    return cb && cb(i18n.t('imMessageFieldsIsNull', { field: '_id' }));
  }

  const options = {};

  if (fields) {
    options.fields = utils.formatSortOrFieldsParams(fields, false);
  }

  messageInfo.collection.findOne({ _id }, options, (err, doc) => {
    if (err) {
      logger.error(err.message);
      return cb && cb(i18n.t('databaseError'));
    }

    return cb && cb(null, doc);
  });
};

module.exports = service;
