const api = {};

const rsmq = config.rsmq;

rsmq.sendMessage({ qname: queueName, message: JSON.stringify(data) }, function (err, resp) {
  if (err) {
    console.log("发送消息失败===>", err);
  }
  if (resp) {
    console.log("data==>", data.type);
  }
});

module.exports = api;