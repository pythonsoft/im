const logger = require('../../common/log')('error');
const utils = require('../../common/utils');
const i18n = require('i18next');

const ActivityInfo = require('./activityInfo');

const activityInfo = new ActivityInfo();

const service = {};

service.setSeq = function (ownerId, sessionId, seq, cb) {
  if (!ownerId) {
    return cb && cb(i18n.t('imActivityFieldsIsNull', { field: 'ownerId' }));
  }

  if (!sessionId || sessionId.length !== 36) {
    return cb && cb(i18n.t('imActivityFieldsIsNull', { field: 'sessionId' }));
  }

  const seqNum = seq * 1;

  if (typeof seqNum !== 'number') {
    return cb && cb(i18n.t('imMessageFieldsIsInvalid', { field: 'seq' }));
  }

  activityInfo.collection.updateOne({
    sessionId,
    ownerId,
    seq: { $lte: seqNum },
  }, { seq: seqNum }, { upsert: true }, (err, r) => {
    if (err) {
      logger.error(err.message);
      return cb && cb(i18n.t('databaseError'));
    }

    return cb && cb(null, r);
  });
};

service.getActivity = function (ownerId, sessionId, cb) {
  if (!ownerId) {
    return cb && cb(i18n.t('imActivityFieldsIsNull', { field: 'ownerId' }));
  }

  if (!sessionId || sessionId.length !== 36) {
    return cb && cb(i18n.t('imActivityFieldsIsNull', { field: 'sessionId' }));
  }

  activityInfo.collection.findOne({ _id: sessionId, ownerId }, (err, doc) => {
    if (err) {
      logger.error(err.message);
      return cb && cb(i18n.t('databaseError'));
    }

    if (!doc) {
      return cb && cb(i18n.t('imActivityIsNotExist'));
    }

    return cb && cb(null, doc);
  });
};

module.exports = service;
