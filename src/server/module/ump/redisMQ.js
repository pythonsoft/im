const config = require('../../config');

const service = {};

service.sendMessage = function sendMessage(queueName, data){
  console.log("queueName===>", queueName);
  console.log("data type===>", data.type);
  if(queueName && data) {
    const rsmq = config.rsmq;
    rsmq.sendMessage({qname: queueName, message: JSON.stringify(data)}, function (err, resp) {
      if (err) {
        console.log("发送消息失败===>", err);
      }
      if (resp) {
        console.log("Message sent. ID:", resp);
      }
    });
  }
}

module.exports = service;