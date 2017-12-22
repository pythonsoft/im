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

service.addMany = function (infos, cb) {
  if(utils.isEmptyObject(infos) || infos.constructor !== Array) {
    return { err: i18n.t('imContactFieldsIsNull', { field: 'infos' }) };
  }

  const len = infos.length;
  const arr = [];
  let temp = null;

  if(len === 0) {
    return cb && cb(i18n.t('xxxx'));
  }

  for(let i = 0, len = infos.length; i < len; i++) {
    temp = getContactInfo(infos[i], infos[i].ownerId);
    if(temp.err) {
      return cb && cb(i18n.t('xxx'));
    }
    arr.push(temp.info);
  }

  contactInfo.insertMany(arr, (err, r) => {
    if(err) {
      return cb && cb(err);
    }

    return cb && cb(null, r);
  });
};

const getContactInfo = function(info, ownerId) {
  if (utils.isEmptyObject(info)) {
    return { err: i18n.t('imContactFieldsIsNull', { field: 'info' }) };
  }

  if (!info.targetId) {
    return { err: i18n.t('imContactFieldsIsNull', { field: 'targetId' }) };
  }

  if (!info.targetName) {
    return { err: i18n.t('imContactFieldsIsNull', { field: 'targetName' }) };
  }

  if (!info.type) {
    return { err: i18n.t('imContactFieldsIsNull', { field: 'type' }) };
  }

  if (!info.ownerId) {
    return { err: i18n.t('imContactFieldsIsNull', { field: 'ownerId' }) };
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

  return { err: '', info: cInfo };
};

service.add = function (info, ownerId, cb) {
  if(info.constructor === Array) {
    service.addMany(info, cb);
    return false;
  }

  const rs = getContactInfo(info, ownerId);

  if(rs.err) {
    return cb && cb (rs.err);
  }

  const cInfo = rs.info;

  const insertOne = function (o) {
    contactInfo.insertOne(o, (err, r) => {
      if (err) {
        return cb && cb(err);
      }

      return cb && cb(null, o);
    });
  };

  contactInfo.collection.findOne({ ownerId: ownerId, targetId: info.targetId}, function(err, doc) {
    if(err){
      return cb && cb(err);
    }
    if(doc){
      return cb && cb(i18n.t('imContactIsExist'));
    }
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
  });
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

service.delete = function (ownerId, targetId, type, cb) {
  if(!ownerId){
    return console.log('deleteError1');
  }

  if(!targetId){
    return console.log('deleteError2');
  }

  if(!type){
    return console.log('deleteError3');
  }

  contactInfo.collection.deleteOne({
    ownerId: ownerId,
    targetId: targetId,
    type: type,
  },(err, doc) => {
    if(err){
      logger.error(err.message);
      return cb && cb(i18n.t('databaseError'));
    }

    if (!doc) {
      return cb && cb(i18n.t('imSessionIsNotExist'));
    }

    return cb && cb(null, doc);
  })
};

service.isFriend = function () {
  
}


module.exports = service;
