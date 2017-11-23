/**
 * Created by steven on 2017/6/28.
 */

'use strict';

const log4js = require('log4js');
const config = require('../config');
const path = require('path');

const logPath = config.logPath;

log4js.configure({
  appenders: {
    console: { type: 'console' },
    access: {
      type: 'dateFile', // 文件输出
      absolute: true,
      filename: path.join(logPath, 'access'),
      pattern: '-yyyy-MM-dd.log',
      alwaysIncludePattern: true,
      category: 'access',
    },
    error: {
      type: 'dateFile', // 文件输出
      absolute: true,
      filename: path.join(logPath, 'error'),
      pattern: '-yyyy-MM-dd.log',
      alwaysIncludePattern: true,
      category: 'error',
    }
  },
  categories: {
    default: { appenders: [ 'console', 'access', 'error' ], level: 'debug' }
  }
});

const loggerCreator = function loggerCreator(name) {
  return log4js.getLogger(name);
};

module.exports = loggerCreator;
