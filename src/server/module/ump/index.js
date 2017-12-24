const config = require('../../config');
const utils = require('../../common/utils');

const api = {};

api.create = function(socketInfo, packageInfo, cb) {
  const rsmq = config.rsmq;
  const data = packageInfo.data;

  rsmq.sendMessage({ qname: socketInfo.queueName, message: JSON.stringify(data) }, function (err, resp) {
    if (err) {
      return cb && cb(err.message);
    }

    return cb && cb(null, data.type);
  });
};

api.update = function() {};

module.exports = api;