const path = require('path');
const request = require('request');
const mime = require('mime');
const config = require('../../config');
const utils = require('../../common/utils');

const api = {};

api.createTask = function(socket, packageInfo, cb) {
  const file = packageInfo.data;

  request.post({
    url: config.callbackAPIHOST.mediaexpress + '/mzapi/createWorkflow',
    headers: {
      ticket: socket.info.ticket
    },
    form: {
      name: file.name,
      originPath: '----',
      rootPath: config.uploadPath,
      storagePath: packageInfo.targetDir,
      size: file.size,
      contentType: mime.getType(path.extname(file.name))
    }
  }, (err, httpResponse, body) => {
    if(err) {
      return cb && cb(err.message);
    }

    const rs = utils.formatRequestResult(body);

    return cb && cb(rs.err, rs.result);
  });
};

api.updateTask = function() {

};

module.exports = api;