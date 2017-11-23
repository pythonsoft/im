const logger = require('../../common/log')('error');
const utils = require('../../common/utils');
const i18n = require('i18next');
const uuid = require('uuid');
const accountService = require('./accountService');

const ContactInfo = require('./contactInfo');

const contactInfo = new ContactInfo();

const service = {};

const hasBeenAdd = function (ownerId, _id, type, cb) {
  contactInfo.collection.findOne({ _id, type }, (err, doc) => {
    if (err) {
      logger.error(err.message);
      return cb && cb(i18n.t('databaseError'));
    }

    return cb && cb(null, doc);
  });
};

service.add = function (info, ownerId, cb) {
  if (utils.isEmptyObject(info)) {
    return cb && cb(i18n.t('imContactFieldsIsNull', { field: 'info' }));
  }

  if (!info.targetId) {
    return cb && cb(i18n.t('imContactFieldsIsNull', { field: 'targetId' }));
  }

  if (!info.targetName) {
    return cb && cb(i18n.t('imContactFieldsIsNull', { field: 'targetName' }));
  }

  if (!info.type) {
    return cb && cb(i18n.t('imContactFieldsIsNull', { field: 'type' }));
  }

  if (!ownerId) {
    return cb && cb(i18n.t('imContactFieldsIsNull', { field: 'ownerId' }));
  }

  const cInfo = utils.merge({
    targetId: '',
    targetName: '',
    photo: '',
    type: '',
    fromWhere: '',
    details: {},
  }, info);

  const t = new Date();

  cInfo._id = uuid.v1();
  cInfo.createdTime = t;
  cInfo.modifyTime = t;
  cInfo.ownerId = ownerId;

  const insertOne = function (o) {
    contactInfo.insertOne(o, (err, r) => {
      if (err) {
        return cb && cb(err);
      }

      return cb && cb(null, o);
    });
  };

  if (cInfo.type !== ContactInfo.TYPE.PERSON) {
    insertOne(cInfo);
  } else {
    accountService.getUsers(cInfo.targetId, (err, docs) => {
      if (err) {
        return cb && cb(err);
      }

      if (!docs || docs.length === 0) {
        return cb && cb(i18n.t('imUserIsNotExist'));
      }

      insertOne(cInfo);
    });
  }
};

service.update = function (_id, updateInfo, cb) {
  if (!_id) {
    return cb && cb(i18n.t('imContactFieldsIsNull', { field: '_id' }));
  }

  if (updateInfo._id) {
    delete updateInfo._id;
  }

  contactInfo.updateOne({ _id }, updateInfo, (err, r) => {
    if (err) {
      logger.error(err.message);
      return cb && cb(i18n.t('databaseError'));
    }

    return cb && cb(null, r);
  });
};

service.list = function (ownerId, type, cb) {
  if (!ownerId) {
    return cb && cb(i18n.t('imContactFieldsIsNull', { field: 'ownerId' }));
  }

  const q = {
    ownerId,
  };

  if (type) {
    q.type = type;
  }

  contactInfo.collection.find(q).toArray((err, docs) => {
    if (err) {
      logger.error(err.message);
      return cb && cb(i18n.t('databaseError'));
    }

    return cb && cb(null, docs);
  });
};

module.exports = service;
