const path = require('path');
const request = require('request');
const mime = require('mime');
const config = require('../../config');
const utils = require('../../common/utils');

const fileConfig = require('../../socket/file/config');

const api = {};

const action = {};

const STATUS = {
  WAITING: '0', // 等待开始命令
  READY: '1', // 可以开始执行任务
  DOING: '2', // 任务执行中
  STOP: '3', // 任务停止
  SUCCESS: '4', // 成功
  ERROR: '100' // 失败
};

action.post = function(ticket, url, params, cb) {
  request.post({
    url: config.callbackAPIHOST.mediaexpress + '/mzapi/' + url,
    headers: {
      ticket: ticket
    },
    form: params
  }, (err, httpResponse, body) => {
    if(err) {
      return cb && cb(err.message);
    }

    const rs = utils.formatRequestResult(body);

    return cb && cb(rs.err, rs.result);
  });
};

const getStatus = function(st) {
  let rs = STATUS.WAITING;

  if (st === fileConfig.STATUS.ready) {
    rs = STATUS.WAITING;
  }else if(st === fileConfig.STATUS.start) {
    rs = STATUS.READY;
  }else if(
    st === fileConfig.STATUS.error ||
    st === fileConfig.STATUS.composeError ||
    st === fileConfig.STATUS.removePackageError
  ) {
    rs = STATUS.ERROR;
  }else if(st === fileConfig.STATUS.success) {
    rs = STATUS.SUCCESS;
  }else if(st === fileConfig.STATUS.stop) {
    rs = STATUS.STOP;
  }else {
    rs = STATUS.DOING;
  }

  return rs;
};

api.create = function(socketInfo, packageInfo, cb) {
  const file = packageInfo.data;

  action.post(socketInfo.ticket, 'createWorkflow', {
    name: file.name,
    originPath: '----',
    rootPath: config.uploadPath,
    storagePath: packageInfo.targetDir,
    size: file.size,
    contentType: mime.getType(path.extname(file.name))
  }, (err, r) => {
    cb && cb(err, r);
  });

};

api.update = function(socketInfo, status, info, callbackResult, cb) {
  if(!callbackResult) {
    return cb && cb('the callbackResult not return from create interface');
  }
  const workflowInfo = callbackResult.workflowInfo;

  if(!workflowInfo) {
    return cb && cb('the callbackResult was not include workflow info');
  }

  const postData = {
    workflowId: workflowInfo._id
  };

  if(status) {
    postData.status = getStatus(status);
  }

  if(info.progress) {
    postData.progress = info.progress;
  }

  if(info.speed) {
    postData.speed = info.speed;
  }


  if(info.message) {
    postData.message = info.message;
  }

  console.log('update upload task -->', postData);

  action.post(socketInfo.ticket, 'updateUploadTask', postData, (err, r) => {
    cb && cb(err, r);
  });
};

module.exports = api;