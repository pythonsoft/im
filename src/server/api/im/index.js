/**
 * Created by steven on 17/11/12.
 */

'use strict';

const express = require('express');
const result = require('../../common/result');

const router = express.Router();
const isLogin = require('../../middleware/login');
const accountService = require('./accountService');

router.use(isLogin.middleware);

router.get('/', (req, res) => {
  res.end('hello im');
});

router.post('/sync', (req, res) => {
  // 请求参数
  const key = req.body.key || 'yunXiang';
  const ticket = req.body.ticket;

  const id = req.body.id;
  const name = req.body.name;
  const photo = req.body.photo;
  const email = req.body.email;
  // 请求参数

  accountService.syncAccount(id, name, photo, email, (err, r) => res.json(result.json(err, r)));
});

module.exports = router;
