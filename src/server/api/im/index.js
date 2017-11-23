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

router.get('/sync', (req, res) => {
  const id = req.query.id;
  const name = req.query.name;
  const photo = req.query.photo;
  const email = req.query.email;

  accountService.syncAccount(id, name, photo, email, (err, r) => res.json(result.json(err, r)));
});

module.exports = router;
