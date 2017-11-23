/**
 * Created by chaoningx on 2017/7/11.
 */

'use strict';

const utils = require('../common/utils');
const i18n = require('i18next');
const logger = require('./log')('error');

// { createdTime: { type: 'string', default: function() { return new Date() }, validation: function(v) {} || 'require' }, allowUpdate: true , unique: true}
// validation = function() { ... return result.fail(i18n.t()) || result.success() }

/*
*
* type 必须写
* default 可以不写
* allowpdate 默认 true，所有model的_id的allowUpdate都必须是true
*
 */

const getValueType = function getValueType(val) {
  return typeof val === 'undefined' ? 'undefined' : val.constructor.name.toLocaleLowerCase();
};

/**
 *
 * @param info
 * @param struct {Object}
 */
const validation = function validation(info, struct) {
  let temp = null;

  for (const k in info) {
    temp = struct[k];

    if (!temp) {
      return i18n.t('fieldIsNotExistError', { field: k });
    }

    if (typeof temp.type !== 'undefined' && getValueType(info[k]) !== temp.type) {
      return i18n.t('typeError', { field: k });
    }

    if (temp.validation) {
      if (temp.validation === 'require') {
        if (info[k] !== 0 && !info[k]) {
          return i18n.t('requireError', { field: k });
        }
      } else if (typeof temp.validation === 'function' && !temp.validation(info[k])) {
        return i18n.t('validationError', { field: k });
      }
    }
  }

  return null;
};

const defaultValue = {
  string: '',
  array: [],
  number: 0,
  object: {},
  boolean: true,
  date() { return new Date(); },
};

class DB {
  constructor(dbInstance, collectionName, indexes) {
    this.collection = dbInstance.collection(collectionName);
    this.struct = {};

    if (indexes) {
      try {
        this.collection.createIndexes(indexes);
      } catch (e) {
        logger.error(e.message);
      }
    }
  }

  assign(info) {
    const doc = {};
    const struct = this.struct;
    let temp = null;
    let defaultType = null;

    for (const k in struct) {
      temp = struct[k];

      if (typeof info[k] !== 'undefined') {
        if (temp.type === 'date') {
          doc[k] = new Date(info[k]);
        } else {
          doc[k] = info[k];
        }
      } else {
        defaultType = getValueType(temp.default);
        if (defaultType !== 'undefined') {
          doc[k] = defaultType === 'function' ? temp.default() : temp.default;
        } else if (temp.type && typeof defaultValue[temp.type] !== 'undefined') {
          if (getValueType(defaultValue[temp.type]) === 'function') {
            doc[k] = defaultValue[temp.type]();
          } else {
            doc[k] = defaultValue[temp.type];
          }
        } else {
          doc[k] = null;
        }
      }
    }

    const err = validation(doc, struct);
    return { err, doc };
  }

  updateAssign(info) {
    const struct = this.struct;
    const doc = {};
    for (const k in info) {
      if (k === '_id') { continue; }
      const temp = struct[k];
      if (temp !== undefined) {
        if (getValueType(temp.allowUpdate) === 'undefined' || temp.allowUpdate) {
          if (temp.type === 'date') {
            doc[k] = new Date(info[k]);
          } else {
            doc[k] = info[k];
          }
        }
      }
    }
    const err = validation(doc, struct);
    return { err, doc };
  }

  assignMany(infos) {
    const docs = [];
    let err = null;

    for (let i = 0, len = infos.length; i < len; i++) {
      const result = this.assign(infos[i]);

      if (result.err) {
        err = result.err;
        break;
      }

      docs.push(result.doc);
    }
    return { err, docs };
  }

  insertOne(info, cb) {
    const result = this.assign(info);

    if (result.err) {
      return cb & cb(result.err);
    }

    const doc = result.doc;

    this.collection.insertOne(doc, (err, r) => {
      if (err) {
        logger.error(JSON.stringify(err));
        return cb && cb(i18n.t('databaseError'));
      }

      return cb && cb(null, r, doc);
    });
  }

  insertMany(infos, cb) {
    const result = this.assignMany(infos);

    if (result.err) {
      return cb & cb(result.err);
    }

    const docs = result.docs;

    this.collection.insertMany(docs, (err, r) => {
      if (err) {
        logger.error(err.message);
        return cb && cb(i18n.t('databaseError'));
      }

      return cb && cb(null, r);
    });
  }

  updateOne(query, info, cb) {
    const result = this.updateAssign(info);

    if (result.err) {
      return cb & cb(result.err);
    }

    const doc = result.doc;

    this.collection.updateOne(query, { $set: doc }, (err, r) => {
      if (err) {
        return cb && cb(err);
      }

      return cb && cb(null, r);
    });
  }

  updateMany(query, info, cb) {
    const result = this.updateAssign(info);

    if (result.err) {
      return cb & cb(result.err);
    }
    const doc = result.doc;

    this.collection.updateMany(query, { $set: doc }, (err, r) => {
      if (err) {
        return cb && cb(err);
      }

      return cb && cb(null, r);
    });
  }

  findOneAndUpdate(query, info, options = null, cb) {
    const result = this.updateAssign(info);

    if (result.err) {
      return cb & cb(result.err);
    }

    this.collection.findOneAndUpdate(query, info, options, (err, r) => {
      if (err) {
        return cb && cb(err);
      }

      return cb && cb(null, r);
    });
  }

  /**
   * 分页组件
   * @param query 查询条件
   * @param page 页码
   * @param pageSize 每页显示条数
   * @param callback 回调函数
   * @param sortFields 排序，传入格式如：'-createdTime,name', "-"代表倒序，没有写代表正序，多个使用","号分割
   * @param fieldsNeed 希望返回的字段，传入格式如：'-createdTime,name', "-"代表不希望返回，多个使用","号分割
   */
  pagination(query, page, pageSize, callback, sortFields, fieldsNeed) {
    const collection = this.collection;
    collection.count(query, (err, count) => {
      if (err) {
        return callback && callback(err);
      }

      page = page > 0 ? page * 1 : 1;
      pageSize = pageSize ? pageSize * 1 : 30;

      let cursor = collection.find(query);

      if (sortFields) {
        cursor.sort(utils.formatSortOrFieldsParams(sortFields, true));
      }

      cursor.skip(page ? ((page - 1) * pageSize) : 0);
      cursor = cursor.limit(pageSize);

      if (fieldsNeed) {
        cursor = cursor.project(utils.formatSortOrFieldsParams(fieldsNeed, false));
      }

      cursor.toArray((err, items) => {
        if (err) {
          return callback && callback(err);
        }

        const pageCount = ((count / pageSize) | 0) + (count % pageSize ? 1 : 0);
        page = page > pageCount ? pageCount : page;

        page = page === 0 ? 1 : page;

        return callback && callback(null, { docs: items, page, pageCount, pageSize, total: count });
      });
    });
  }
}

module.exports = DB;
