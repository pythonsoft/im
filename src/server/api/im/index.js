/**
 * Created by steven on 17/11/12.
 */

'use strict';

const express = require('express');
const result = require('../../common/result');

const router = express.Router();
const isLogin = require('../../middleware/login');
const accountService = require('./accountService');
const contactService = require('./contactService');


/**
 * @swagger
 * /im/login:
 *   post:
 *     description: 登录
 *     tags:
 *       - v1
 *       - AccountInfo
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: body
 *         description: 登录
 *         schema:
 *           type: object
 *           required:
 *             - id
 *           properties:
 *             id:
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
router.post('/login', (req, res) => {
  accountService.login(req.body.id, (err, r) => res.json(result.json(err, r)));
});


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
  // 请求参数

  accountService.syncAccount(id, name, photo, email, (err, r) => res.json(result.json(err, r)));
});

/**
 * @swagger
 * /im/contact/add:
 *   post:
 *     description: 增加联系人
 *     tags:
 *       - v1
 *       - ContactInfo
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: body
 *         description: 增加联系人
 *         schema:
 *           type: object
 *           required:
 *             - ownerId
 *             - targetId
 *             - targetName
 *             - type
 *           properties:
 *             ownerId:
 *               type: string
 *               description: '拥有者Id'
 *               example: ""
 *             targetId:
 *               type: string
 *               description: '增加的对象Id'
 *               example: ""
 *             targetName:
 *               type: string
 *               description: '增加的对象name'
 *               example: ""
 *             type:
 *               type: string
 *               description: '联系人类型,0:人,1:群,2:传输盒子'
 *               example: "0"
 *             photo:
 *               type: string
 *               description: '联系人头像'
 *               example: ""
 *             fromWhere:
 *               type: string
 *               description: '来源,0:快传,1:ump'
 *               example: "0"
 *     responses:
 *       200:
 *         description: ContactInfo
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
router.post('/contact/add', (req, res) => {
  contactService.add(req.body, req.body.ownerId, (err, r) => res.json(result.json(err, r)));
});

/**
 * @swagger
 * /im/contact/update:
 *   post:
 *     description: 更新联系人
 *     tags:
 *       - v1
 *       - ContactInfo
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: body
 *         description: 更新联系人
 *         schema:
 *           type: object
 *           required:
 *             - _id
 *           properties:
 *             _id:
 *               type: string
 *               description: 'ContactInfo _id'
 *               example: ""
 *             targetId:
 *               type: string
 *               description: '增加的对象Id'
 *               example: ""
 *             targetName:
 *               type: string
 *               description: '增加的对象name'
 *               example: ""
 *             type:
 *               type: string
 *               description: '联系人类型,0:人,1:群,2:传输盒子'
 *               example: "0"
 *             photo:
 *               type: string
 *               description: '联系人头像'
 *               example: ""
 *             fromWhere:
 *               type: string
 *               description: '来源,0:快传,1:ump'
 *               example: "0"
 *     responses:
 *       200:
 *         description: ContactInfo
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
router.post('/contact/update', (req, res) => {
  contactService.add(req.body._id, req.body, (err, r) => res.json(result.json(err, r)));
});

/**
 * @swagger
 * /im/contact/list:
 *   get:
 *     description: get catalog task detail
 *     tags:
 *       - v1
 *       - ContactInfo
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: ownerId
 *         description: '拥有者Id'
 *         required: true
 *         type: string
 *         example: ''
 *         collectionFormat: csv
 *       - in: query
 *         name: type
 *         description: '联系人类型,0:人,1:群,2:传输盒子'
 *         required: false
 *         type: string
 *         example: '0'
 *         collectionFormat: csv
 *     responses:
 *       200:
 *         description:
 */
router.get('/contact/list', (req, res) => {
  contactService.list(req.query.ownerId, req.query.type, (err, r) => res.json(result.json(err, r)));
});


module.exports = router;
