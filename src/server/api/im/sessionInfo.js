/**
 * Created by chaoningx on 17/11/12.
 */

'use strict';

const uuid = require('uuid');

const DB = require('../../common/db');
const config = require('../../config');

class SessionInfo extends DB {
  constructor() {
    super(config.dbInstance[`${config.dbName}DB`], 'IM_SessionInfo');

    this.struct = {
      _id: { type: 'string', default: () => uuid.v1() },
      name: { type: 'string', validation: 'require' },
      creatorId: { type: 'string', validation: 'require', allowUpdate: false },
      type: { type: 'string',
        allowUpdate: false,
        validation(v) {
          let flag = false;

          for (const k in SessionInfo.TYPE) {
            if (v === SessionInfo.TYPE[k]) {
              flag = true;
            }
          }

          return flag;
        },
        default: () => SessionInfo.TYPE.C2C },
      members: { type: 'array' }, // [{ _id: '', name: '', photo: '' }]
      admin: { type: 'object', default() { return { _id: '', name: '' }; } }, // 管理员
      createdTime: { type: 'date', validation: 'requirde', allowUpdate: false },
      modifyTime: { type: 'date', validation: 'require' },
      messageIndex: { type: 'number', default() { return 1; }, validation: 'require' },
      isOnTop: { type: 'boolean', default() { return false; } },
      onTopCreatedTime: { type: 'date' },
      details: { type: 'object' },
    };
  }
}

SessionInfo.TYPE = {
  C2C: '1',
  GROUP: '2',
};

module.exports = SessionInfo;
