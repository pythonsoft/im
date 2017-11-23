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
  const ticket = query[TICKET_COOKIE_NAME] || (req.cookies[TICKET_COOKIE_NAME] || req.header(TICKET_COOKIE_NAME)) || (req.body || req.body[TICKET_COOKIE_NAME]);

  if (!ticket) {
    return false;
  }

  if (!query.key) {
    return false;
  }

  const key = config.secret[query.key];

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
    const now = new Date().getTime();
    if (decodeTicket[1] > now) { // token有效期内
      req.query = utils.trim(req.query);
      req.ex = { userId: decodeTicket[0], key: req.query.key };

      if (!(req.headers['content-type'] && req.headers['content-type'].indexOf('multipart/form-data') !== -1)) {
        req.body = utils.trim(req.body);
      }

      next();
    } else { // 过期
      res.clearCookie(TICKET_COOKIE_NAME);
      return res.json(result.fail(req.t('loginExpired')));
    }
  } else {
    return res.json(result.fail(req.t('notLogin')));
  }
};

login.webSocketMiddleware = function (socket) {
  const authorize = socket.request.headers[`im-${TICKET_COOKIE_NAME}`] || utils.formatCookies(socket.request.headers.cookie)[TICKET_COOKIE_NAME];
  let secret = socket.request.headers['im-secret'] || '0';
  const key = socket.request.headers['im-key'] || 'yunXiang';

  if (!key) {
    return result.fail(i18n.t('imAuthorizeInvalid'));
  }

  const secretKey = config.secret[key];

  if (!secretKey) {
    return result.fail(i18n.t('imAuthorizeInvalid'));
  }

  if (authorize) {
    try {
      const dec = utils.decipher(authorize, key);
      const codes = dec.split(',');
      const userId = codes[0];
      const expireDate = codes[1];

      const now = new Date().getTime();

      if (expireDate < now) { // 过期
        return result.fail(i18n.t('imLoginDateExpire'));
      }

      secret = secret === '1' ? '1' : '0';

      if (userId) {
        return result.success({ socketId: socket.id, info: { userId, secret, key } });
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
