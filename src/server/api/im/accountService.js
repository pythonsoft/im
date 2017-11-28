const logger = require('../../common/log')('error');
const utils = require('../../common/utils');
const i18n = require('i18next');
const token = require('../../common/token');
const config = require('../../config');

const AccountInfo = require('./accountInfo');

const accountInfo = new AccountInfo();

const service = {};

service.syncAccount = function (info, cb) {
  const aInfo = utils.merge({
    _id: '',
    name: '',
    photo: '',
    email: '',
    phone: '',
  }, info);

  if (!aInfo._id || aInfo._id.length !== 36) {
    return cb && cb(i18n.t('imAccountFieldsIsNull', { field: '_id' }));
  }

  if (!aInfo.name) {
    return cb && cb(i18n.t('imAccountFieldsIsNull', { field: 'name' }));
  }

  accountInfo.collection.findOne({ _id: aInfo._id }, { fields: { _id: 1 } }, (err, doc) => {
  if (aInfo.email && !utils.checkEmail(aInfo.email)) {
    return cb && cb(i18n.t('imAccountFieldsIsNull', { field: 'email' }));
  }
    if (doc) {
      delete aInfo._id;
      accountInfo.updateOne({ _id: aInfo._id }, aInfo, (err) => {
        if (err) {
          logger.error(err.message);
          return cb && cb(i18n.t('databaseError'));
        }
        return cb && cb(null, aInfo);
      })
    }else {
      aInfo.createdTime = new Date();

      accountInfo.insertOne(aInfo, (err, r) => {
        if (err) {
          logger.error(err.message);
            return cb && cb(i18n.t('databaseError'));
          }
          return cb && cb(null, r);
        });
      }
    });
  };

service.login = function (id, cb, key) {
  if (!id) {
    return cb && cb(i18n.t('imAccountFieldsIsNull', { fields: 'id' }));
  }
  accountInfo.collection.findOne({ _id: id }, (err, doc) => {
    if (err) {
      logger.error(err.message);
      return cb && cb(i18n.t('databaseError'));
    }

    if (!doc) {
      return cb && cb(i18n.t('imUserIsNotExist'));
    }

    const k = config.secret[key] || config.secret.yunXiang;
    const t = new Date();
    const expires = t.getTime() + config.cookieExpires;
    const ticket = token.create(id, expires, k);

    return cb && cb(null, ticket, doc);
  });
};

service.update = function (id, updateInfo, cb) {
  if (!id) {
    return cb && cb(i18n.t('imAccountFieldsIsNull', { field: 'id' }));
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

service.list = function(keyword, page=1, pageSize=20, sortFields='-createdTime', fieldNeeds, cb) {
  const q = {};

  if (keyword) {
    q.$or = [
      { name: { $regex: keyword, $options: 'i' } },
      { email: { $regex: keyword, $options: 'i' } },
      { phone: { $regex: keyword, $options: 'i' } },
    ];
  }

  accountInfo.pagination(q, page, pageSize, (err, rs) => {
    if (err) {
      logger.error(err.message);
      return cb && cb(i18n.t('databaseError'));
    }

    return cb && cb(null, rs);
  }, sortFields, fieldNeeds);

};

module.exports = service;
