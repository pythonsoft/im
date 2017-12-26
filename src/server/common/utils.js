/**
 * Created by chaoningx on 2017/2/27.
 */

'use strict';

const crypto = require('crypto');
const os = require('os');
const i18n = require('i18next');
const request = require('request');
const logger = require('./log')('error');

const utils = {};

utils.isEmptyObject = function isEmptyObject(obj) {
  if (obj === null || typeof obj === 'undefined') return true;

  if (obj.length && obj.length > 0) return false;
  if (obj.length === 0) return true;

  for (const key in obj) {
    if (hasOwnProperty.call(obj, key)) return false;
  }

  return true;
};

utils.merge = function merge(source, target) {
  if (utils.isEmptyObject(target)) { return source; }
  if (utils.isEmptyObject(source)) {
    if (typeof source === 'string') {
      return '';
    }

    return {};
  }

  const s = Object.assign({}, source);

  for (const k in s) {
    if (target[k]) {
      s[k] = target[k];
    }
  }

  return s;
};

/**
 * 合并2个object
 * @param source
 * @param target
 * @returns {*}
 */
utils.softMerge = function merge(source, target) {
  for (const k in target) {
    source[k] = target[k];
  }

  return source;
};

/**
 * @description 去重合并
 * @param arr
 * @param arr2
 * @returns []
 */
utils.hardMerge = function hardMerge(arr, arr2) {
  const arr1 = arr.slice(); // clone arr
  for (let j = 0; j < arr2.length; j++) {
    const index = arr1.indexOf(arr2[j]);
    if (index !== -1) {
      arr1.splice(index, 1);
    }
  }
  for (let i = 0; i < arr2.length; i++) {
    arr1.push(arr2[i]);
  }
  return arr1;
};

/**
 * @description 数组相减
 * @param arr1
 * @param arr2
 * @returns []
 */
utils.minusArr = function minusArr(arr1, arr2) {
  for (let j = 0; j < arr2.length; j++) {
    const index = arr1.indexOf(arr2[j]);
    if (index !== -1) {
      arr1.splice(index, 1);
    }
  }
  return arr1;
};

utils.cipher = function cipher(str, password) {
  const cipher = crypto.createCipher('aes-256-cbc', password);
  let crypted = cipher.update(str, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
};

utils.decipher = function decipher(str, password) {
  const decipher = crypto.createDecipher('aes-256-cbc', password);
  let dec = decipher.update(Buffer.from(str, 'hex'), 'utf8');
  dec += decipher.final('utf8');
  return dec;
};

utils.trim = function trim(obj) {
  if (typeof obj === 'string') {
    return obj.trim();
  }
  let rs = {};

  if (obj instanceof Array) {
    rs = [];
    for (let i = 0, len = obj.length; i < len; i++) {
      if (typeof obj[i] === 'string') {
        rs.push(obj[i].trim());
      } else {
        rs.push(obj[i]);
      }
    }

    return rs;
  }

  for (const t in obj) {
    if (typeof obj[t] === 'string') {
      rs[t] = obj[t].trim();
    } else {
      rs[t] = obj[t];
    }
  }
  return rs;
};

utils.tpl = function tpl(str, data) {
  for (const item in data) {
    str = str.replace(new RegExp(`\{\\$${item}\}`, 'gmi'), data[item]);
  }
  str = str.replace(/\{\$(.*?)\}/ig, '');
  return str;
};

utils.analysisNetworkInterfaces = function analysisNetworkInterfaces() {
  const nf = os.networkInterfaces();
  const ips = [];
  for (const k in nf) {
    const n = nf[k];
    for (let i = 0, len = n.length; i < len; i++) {
      if (n[i].address && /^[0-9.]{1,20}$/.exec(n[i].address)) {
        ips.push(n[i].address);
      }
    }
  }

  return ips;
};

utils.checkEmail = function checkEmail(email) {
  if ((email.length > 128) || (email.length < 6)) {
    return false;
  }
  return !!email.match(/^[A-Za-z0-9+]+[A-Za-z0-9\.\_\-+]*@([A-Za-z0-9\-]+\.)+[A-Za-z0-9]+$/);
};

utils.checkPhone = function checkPhone(phone) {
  if (phone.length !== 11) {
    return false;
  }
  if (/^1[34578]\d{9}$/.test(phone) === false) {
    return false;
  }
  return true;
};

/**
 * 2-20位有效字符
 * @param name
 * @returns {boolean}
 */
utils.checkVipName = function checkVipName(name) {
  return /^[0-9a-zA-Z_\u4e00-\u9fa5]{2,20}$/.test(name);
};

utils.checkPassword = function checkPassword(password) {
  return /^[0-9a-zA-Z_]{6,20}$/.test(password);
};

utils.formatSortOrFieldsParams = function formatSortOrFieldsParams(sortString, isSort) {
  const sorts = {};
  let arr = [];
  if (sortString.indexOf(',') !== -1) {
    arr = sortString.split(',');
  } else {
    arr.push(sortString);
  }

  const flags = {
    sorts: [-1, 1],
    fields: [0, 1],
  };

  const flag = isSort ? flags.sorts : flags.fields;

  for (let i = 0, len = arr.length; i < len; i++) {
    sorts[arr[i].trim().replace('-', '')] = /^-/.test(arr[i]) ? flag[0] : flag[1];
  }

  return sorts;
};

utils.clone = function clone(origin) {
  return JSON.parse(JSON.stringify(origin));
};

utils.isValueInObject = function isValueInObject(val, obj) {
  let flag = false;
  for (const k in obj) {
    if (obj[k] === val) {
      flag = true;
      break;
    }
  }
  return flag;
};

utils.minusArray = function minusArray(arr1, arr2) {
  for (let i = 0, len = arr1.length; i < len; i++) {
    if (arr2.indexOf(arr1[i]) !== -1) {
      arr1.splice(i, 1);
    }
  }
  return arr1;
};

utils.getValueType = function getValueType(val) {
  return typeof val === 'undefined' ? 'undefined' : val.constructor.name.toLocaleLowerCase();
};

/**
 *
 * @param info
 * @param struct {Object}
 */
utils.validation = function validation(info, struct) {
  let temp = null;

  for (const k in struct) {
    temp = struct[k];

    if (!info[k]) {
      return i18n.t('fieldIsNotExistError', { field: k });
    }

    if (typeof temp.type !== 'undefined' && utils.getValueType(info[k]) !== temp.type) {
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

utils.getAllowedUpdateObj = function getAllowedUpdateObj(fields, info) {
  const rs = {};
  const fieldsArr = fields.split(',');
  fieldsArr.forEach((item) => {
    if (typeof info[item] !== 'undefined') {
      rs[item] = info[item];
    }
  });
  return rs;
};

/**
 * @param uri
 * @param method "POST" or "GET"
 * @param info
 * @param cb
 */
utils.baseRequestCallApi = function baseRequestCallApi(url, method, info, token, cb) {
  const options = {
    method: method || 'GET',
    url,
  };
  if (method === 'POST') {
    options.form = JSON.parse(JSON.stringify(info));
    options.headers = {
      'content-type': 'application/x-www-form-urlencoded',
      cache: 'no-cache',
      token,
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
    };
  } else {
    options.qs = info;
    options.headers = {
      'cache-control': 'no-cache',
      token,
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
    };
  }

  request(options, (error, response) => {
    if (!error && response.statusCode === 200) {
      return cb && cb(null, response);
    } else if (error) {
      logger.error(error);
      return cb && cb(i18n.t('requestCallApiError', { error }));
    }
    logger.error(response.body);
    return cb && cb(i18n.t('requestCallApiFailed'));
  });
};

/**
 * @param uri
 * @param method "POST" or "GET"
 * @param info
 * @param cb
 */
utils.baseRequestUploadFile = function baseRequestCallApi(url, formData, token, cb) {
  const options = {
    method: 'POST',
    url,
    headers: {
      'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
    },
    formData,
  };
  request(options, (error, response) => {
    if (!error && response.statusCode === 200) {
      return cb && cb(null, response.body);
    } else if (error) {
      logger.error(error);
      return cb && cb(i18n.t('requestCallApiError', { error }));
    }
    logger.error(response.body);
    return cb && cb(i18n.t('requestCallApiFailed'));
  });
};

/**
 * @param uri
 * @param method "POST" or "GET"
 * @param info
 * @param cb
 */
utils.requestCallApi = function requestCallApi(url, method, info, token, cb) {
  utils.baseRequestCallApi(url, method, info, token, (err, response) => {
    // console.log('requestCallApi ------>', response.body, err);
    if (err) {
      return cb && cb(err);
    }
    const rs = JSON.parse(response.body);
    return cb && cb(null, rs);
  });
};


/**
 * @param uri
 * @param method "POST" or "GET"
 * @param info
 * @param cb
 */
utils.requestCallApiGetCookie = function requestCallApi(url, method, info, token, cb) {
  utils.baseRequestCallApi(url, method, info, token, (err, response) => {
    if (err) {
      return cb && cb(err);
    }
    const rs = JSON.parse(response.body);
    if (rs.status === 0) {
      const cookie = response.headers['set-cookie'];
      try {
        const token = cookie[0].split(';')[0].split('=')[1];
        return cb && cb(null, token);
      } catch (e) {
        return cb && cb(i18n.t('requestCallApiError', { error: e.message }));
      }
    }

    return cb && cb(i18n.t('requestCallApiError', { error: rs.result.message }));
  });
};

/**
 * @param uri
 * @param method "POST" or "GET"
 * @param info
 * @param cb
 */
utils.commonRequestCallApi = function commonRequestCallApi(options, cb) {
  request(options, (error, response) => {
    if (!error && response.statusCode === 200) {
      const rs = response.body;
      return cb && cb(null, rs);
    } else if (error) {
      logger.error(error);
      return cb && cb(i18n.t('requestCallApiError', { error }));
    }
    logger.error(response.body);
    return cb && cb(i18n.t('requestCallApiFailed'));
  });
};

utils.formatValueNeedSplitWidthFlag = function formatParamsNeedSplitWidthFlag(val, flag, removeAllSpaceInValue = true) {
  let v = val;

  if (removeAllSpaceInValue) {
    v = v.replace(/\s/g, '');
  }

  return v.split(flag);
};

utils.console = function (title, content) {
  console.log(`******** ${title} ********`);
  if (!content) {
    return false;
  }
  console.log(content);
  console.log(`******** ${title} ********`);
};

utils.formatCookies = function (cookies) {
  const cs = {};
  if (!cookies) { return cs; }
  const arr = cookies.split('; ');
  let temp = '';
  for (let i = 0, len = arr.length; i < len; i++) {
    temp = arr[i].split('=');
    cs[temp[0]] = temp[1];
  }

  return cs;
};

utils.processWrite = function (str) {
  const out = process.stdout;
  if (!out || !out.clearLine) {
    console.log(str);
    return;
  }
  out.clearLine();
  out.cursorTo(0);
  out.write(str);
};

utils.formatSize = function (size, isNeedUnit) {
  let str = '';
  let unit = 'B';
  if (size < 1000) {
    str = size;
  } else if (size < 1000 * 1000) {
    str = Math.round(100 * (size / 1024)) / 100;
    unit = 'KB';
  } else if (size < 1000 * 1000 * 1000) {
    str = Math.round(100 * (size / (1024 * 1024))) / 100;
    unit = 'MB';
  } else {
    str = Math.round(100 * (size / (1024 * 1024 * 1024))) / 100;
    unit = 'GB';
  }
  return isNeedUnit ? { size: str, unit } : (`${str} ${unit}`);
};

utils.formatRequestResult = function (data) {
  const err = null;
  const result = null;

  if (!data) {
    return { err: '接口服务没有数据返回', result };
  }

  try {
    const rs = JSON.parse(data);

    if (rs.status !== 0) {
      return { err: rs.result, result };
    }

    return { err, result: rs.result };
  } catch (e) {
    return { err: e.message, result };
  }
};

module.exports = utils;
