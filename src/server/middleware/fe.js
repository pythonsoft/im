/**
 * Created by chaoningxie on 26/2/17.
 */

'use strict';

const path = require('path');
const fs = require('fs');

const fe = {};

const routersPath = path.join(__dirname, '../../fe/routers');

fe.middleware = function middleware(req, res, next) {
  const url = req.originalUrl;

  if (path.extname(url) || /^\/api/.test(url) || /^\/api-docs/.test(url)) {
    return next();
  }

  if (!fs.statSync(path.join(routersPath, url)).isDirectory()) {
    res.render('404');
    return false;
  }

  res.render('index');
};

module.exports = fe;
