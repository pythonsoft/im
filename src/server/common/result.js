/**
 * Created by steven on 2017/6/14.
 */

'use strict';

const result = {};
const logger = require('../common/log')('error');

/**
 * @swagger
 * definitions:
 *   ResultInfo:
 *     properties:
 *       status:
 *         type: string
 *       data:
 *         type: object
 *       statusInfo:
 *         type: object
 *         properties:
 *           message:
 *             type: string
 */
const build = function build(code, data, message = null, cid) {
  if (code === '0') {
    message = 'ok';
  }

  const rs = { status: code, data, statusInfo: { message } };

  if(cid) {
    rs.cid = cid;
  }

  return rs;
};

result.success = function success(data, message = 'ok', cid) {
  return build('0', data, message, cid);
};

result.fail = function fail(err, data = {}, cid) {
  return build(err.code, data, err.message, cid);
};

result.json = function json(err, rs, log4jContent) {
  if (err) {
    if (log4jContent) {
      logger.error(log4jContent);
    }

    return result.fail(err);
  }

  return result.success(rs);
};

module.exports = result;
