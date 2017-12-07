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

/**
 * @swagger
 * /im/sync:
 *   post:
 *     description: 同步账户
 *     tags:
 *       - v1
 *       - AccountInfo
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: body
 *         description: 同步账户
 *         schema:
 *           type: object
 *           required:
 *             - id
 *             - name
 *             - photo
 *           properties:
 *             id:
 *               type: string
 *               description: ''
 *               example: ""
 *             name:
 *               type: string
 *               description: ''
 *               example: ""
 *             photo:
 *               type: string
 *               description: ''
 *               example: ""
 *             email:
 *               type: string
 *               description: ''
 *               example: ""
 *     responses:
 *       200:
 *         description: AccountInfo
 *         schema:
 *           type: object
 *           properties:
 *            status:
 *              type: string
 *            data:
 *              type: object
 *            statusInfo:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 */
router.post('/sync', (req, res) => {
  // 请求参数
  const id = req.body.id;
  const name = req.body.name;
  const photo = req.body.photo;
  const email = req.body.email;
  const phone = req.body.phone;
  // 请求参数

  accountService.syncAccount({
    _id: id,
    name,
    photo,
    email,
    phone,
  }, (err, r) => res.json(result.json(err, r)));
});

module.exports = router;
