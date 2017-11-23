'use strict';

module.exports = function socketAPI(io) {
  const chat = require('./socket/chat');
  new chat(io);
  const file = require('./socket/file');
  new file(io);
};
