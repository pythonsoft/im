const config = require('../../config');
const utils = require('../../common/utils');

const api = {};

api.createTask = function(socket, packageInfo, cb) {
  const rsmq = config.rsmq;
  const data = packageInfo.data;

  rsmq.sendMessage({ qname: socket.info.queueName, message: JSON.stringify(data) }, function (err, resp) {
    if (err) {
      return cb && cb(err.message);
    }

    return cb && cb(null, data.type);
  });
};

module.exports = api;