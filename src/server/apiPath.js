'use strict';

module.exports = function api(app) {
  app.use('/im', require('./api/im'));
};
