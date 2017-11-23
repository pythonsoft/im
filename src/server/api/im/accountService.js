const logger = require('../../common/log')('error');
const utils = require('../../common/utils');
const i18n = require('i18next');

const AccountInfo = require('./accountInfo');

const accountInfo = new AccountInfo();

const service = {};

service.syncAccount = function (id, name, photo, email, cb) {
  if (!id || id.length !== 36) {
    return cb && cb(i18n.t('imAccountFieldsIsNull', { field: 'id' }));
  }

  if (!name) {
    return cb && cb(i18n.t('imAccountFieldsIsNull', { field: 'name' }));
  }

  if (!photo) {
    return cb && cb(i18n.t('imAccountFieldsIsNull', { field: 'photo' }));
  }

  accountInfo.collection.findOne({ _id: id }, { fields: { _id: 1 } }, (err, doc) => {
    if (err) {
      logger.error(err.message);
      return cb && cb(i18n.t('databaseError'));
    }

    if (doc) {
      return cb && cb(i18n.t('imUserIsExist'));
    }

    const info = {
      _id: id,
      name,
      photo,
      email,
      createdTime: new Date(),
    };

    accountInfo.insertOne(info, (err, r) => {
      if (err) {
        logger.error(err.message);
        return cb && cb(i18n.t('databaseError'));
      }

      return cb && cb(null, r);
    });
  });
};

service.login = function (id, cb) {
  if (!id) {
    return cb && cb(i18n.t('imAccountFieldsIsNull', { fields: 'id' }));
  }
  accountInfo.collection.findOne({ _id: id }, (err, doc) => {
    if (err) {
      logger.error(err.message);
      return cb && cb(i18n.t('databaseError'));
    }

    if (!doc) {
      cb && cb(i18n.t('imUserIsNotExist'));
    }

    return cb && cb(null, doc);
  });
};

service.update = function (id, updateInfo, cb) {
  if (id) {
    return cb && cb(i18n.t('imAccountFieldsIsNull', { fields: 'id' }));
  }

  if (updateInfo._id) {
    delete updateInfo._id;
  }

  updateInfo.modifyTime = new Date();

  accountInfo.updateOne({ _id: id }, updateInfo, (err, r) => {
    if (err) {
      logger.error(err.message);
      return cb && cb(i18n.t('databaseError'));
    }

    return cb && cb(null, r);
  });
};

service.getUsers = function getUsers(ids, cb) {
  if (!ids) {
    return cb && cb(i18n.t('imAccountFieldsIsNull', { fields: 'id' }));
  }
  const q = {};

  if (ids.constructor === Array) {
    q._id = { $in: ids };
  } else if (ids.indexOf(',')) {
    q._id = { $in: ids.split(',') };
  } else {
    q._id = ids;
  }

  let cursor = accountInfo.collection.find(q);
  const fieldsNeed = '_id,photo,name';
  cursor = cursor.project(utils.formatSortOrFieldsParams(fieldsNeed, false));

  cursor.toArray((err, docs) => {
    if (err) {
      logger.error(err.message);
      return cb && cb(i18n.t('databaseError'));
    }

    return cb && cb(null, docs);
  });
};

module.exports = service;
