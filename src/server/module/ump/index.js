const config = require('../../config');
const utils = require('../../common/utils');
const mime = require('mime');
const path = require('path');

const api = {};


api.create = function (socketInfo, packageInfo, cb) {
  const data = packageInfo.data;
  let url = `${config.callbackAPIHOST.ump}/manuscript/createWebSocketTask`;
  const info = {
    _id: data._id,
    name: data.name,
    fileInfo: {
      size: data.size,
      name: data.name,
      lastModifiedTime: data.lastModifiedTime,
      relativePath: packageInfo.relativePath,
      targetDir: packageInfo.targetDir,
      contentType: mime.getType(path.extname(data.name)),
    },
  };
  const ticket = socketInfo.ticket;
  url += `?ticket=${ticket}`;
  utils.requestCallApi(url, 'POST', info, ticket, (err, rs) => {
    if (err) {
      return cb && cb(err.message);
    }

    if (rs.status === '0') {
      return cb && cb(null, rs.data);
    }

    return cb && cb(rs.statusInfo.message);
  });
};

api.update = function (socketInfo, status, info, callbackResult, cb) {
  let url = `${config.callbackAPIHOST.ump}/manuscript/updateWebSocketTask`;
  const tInfo = {
    _id: socketInfo._id,
  };
  if (status) {
    tInfo.status = status;
  }
  if (info) {
    tInfo.progress = info.progress;
    tInfo.speed = info.speed;
    tInfo['fileInfo.receivedSize'] = info.receivedSize;
    tInfo['fileInfo.totalSize'] = info.totalSize;
  }
  const ticket = socketInfo.ticket;
  url += `?ticket=${ticket}`;
  utils.requestCallApi(url, 'POST', tInfo, ticket, (err, rs) => {
    if (err) {
      return cb && cb(err.message);
    }

    if (rs.status === '0') {
      return cb && cb(null, rs.data);
    }

    return cb && cb(rs.statusInfo.message);
  });
};

module.exports = api;
