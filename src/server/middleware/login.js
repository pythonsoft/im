/**
 * Created by chaoningxie on 26/2/17.
 */

'use strict';

const logger = require('../common/log')('error');
const i18n = require('i18next');
const utils = require('../common/utils');
const result = require('../common/result');
const token = require('../common/token');
const config = require('../config');

const TICKET_COOKIE_NAME = 'im-ticket';

const login = {};

login.isLogin = function isLogin(req) {
  const query = utils.trim(req.query);
  const sk = query.key || req.body.key || 'yunXiang';
  const ticket = query[TICKET_COOKIE_NAME] ||
    (req.cookies[TICKET_COOKIE_NAME] || req.header(TICKET_COOKIE_NAME)) ||
    (req.body && req.body[TICKET_COOKIE_NAME]) ||
    (req.query && req.query[TICKET_COOKIE_NAME]);

  if (!ticket) {
    return false;
  }

  if (!sk) {
    return false;
  }

  const key = config.secret[sk];

  if (!key) {
    return false;
  }

  const decodeTicket = token.decipher(ticket, key);

  if (!decodeTicket) {
    return false;
  }

  return decodeTicket;
};

login.middleware = function middleware(req, res, next) {
  const decodeTicket = login.isLogin(req);
  if (decodeTicket) {
    req.query = utils.trim(req.query);
    req.ex = { userId: decodeTicket[0], key: req.query.key };

    if (!(req.headers['content-type'] && req.headers['content-type'].indexOf('multipart/form-data') !== -1)) {
      req.body = utils.trim(req.body);
    }

    next();
  } else {
    return res.json(result.fail(req.t('notLogin')));
  }
};

login.webSocketMiddleware = function (socket) {
  const authorize = socket.request.headers[TICKET_COOKIE_NAME]
    || socket.request.headers[TICKET_COOKIE_NAME]
    || utils.formatCookies(socket.request.headers.cookie)[TICKET_COOKIE_NAME]
    || socket.handshake.query[TICKET_COOKIE_NAME];

  let secret = socket.request.headers['im-secret'] || '0';
  let key = socket.request.headers['im-key'] || socket.handshake.query['im-key'] || 'yunXiang';

  if (!key) {
    return result.fail(i18n.t('imAuthorizeInvalid'));
  }

  const secretKey = config.secret[key];

  if (!secretKey) {
    return result.fail(i18n.t('imAuthorizeInvalid'));
  }

  if (authorize) {
    try {
      const dec = utils.decipher(authorize, secretKey);
      const codes = dec.split(',');
      const userId = codes[0];

      secret = secret === '1' ? '1' : '0';

      if (userId) {
        return result.success({
          socketId: socket.id,
          task: {},
          info: {
            key,
            userId,
            secret: secret === '1',
            ticket: authorize,
            queueName: config.queueName[key],
            cryptoKey: config.cryptoKey[key] || ''
          }
        });
      }
      return result.fail(i18n.t('imAuthorizeInvalid'));
    } catch (e) {
      return result.fail(i18n.t('imAuthorizeInvalid'));
    }
  } else {
    return result.fail(i18n.t('imAuthorizeInHeadInvalid'));
  }
};

module.exports = login;
