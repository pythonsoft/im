/**
 * Created by chaoningx on 17/11/18.
 * 用于记录用户已读消息的位置
 * 谁在什么会话中读到哪里了。这就是本类所需要记录的信息
 */

'use strict';

const uuid = require('uuid');

const DB = require('../../common/db');
const config = require('../../config');

class ActivityInfo extends DB {
  constructor() {
    super(config.dbInstance[`${config.dbName}DB`], 'IM_ActivityInfo');

    this.struct = {
      _id: { type: 'string', default: () => uuid.v1(), allowUpdate: false }, // 使用sessionId, sessionInfo._id
      ownerId: { type: 'string', allowUpdate: false },
      sessionId: { type: 'string', validation: 'require', allowUpdate: false },
      seq: { type: 'number', validation(v) { return typeof v === 'number'; }, default() { return 0; } },
      createdTime: { type: 'date', allowUpdate: false },
      details: { type: 'object' },
    };
  }
}

module.exports = ActivityInfo;
