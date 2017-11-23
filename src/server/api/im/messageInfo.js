/**
 * Created by chaoningx on 17/11/11.
 */

'use strict';

const uuid = require('uuid');

const DB = require('../../common/db');
const config = require('../../config');

class MessageInfo extends DB {
  constructor() {
    super(config.dbInstance[`${config.dbName}DB`], 'IM_DialogInfo');

    this.struct = {
      _id: { type: 'string', default: () => uuid.v1() },
      from: { type: 'object', default() { return { _id: '', type: '' }; } },
      to: { type: 'object', default() { return { _id: '', type: '' }; } },
      sessionId: { type: 'string', validation: 'require', allowUpdate: false },
      seq: { type: 'number', validation(v) { return typeof v === 'number'; }, default() { return 0; } },
      type: { type: 'string',
        allowUpdate: false,
        validation(v) {
          let flag = false;

          for (const k in MessageInfo.TYPE) {
            if (v === MessageInfo.TYPE[k]) {
              flag = true;
            }
          }

          return flag;
        },
        default: () => MessageInfo.TYPE.C2C },
      createdTime: { type: 'date', validation: 'require', allowUpdate: false },
      content: { type: 'string' },
      details: { type: 'object' },
    };
  }
}

MessageInfo.TYPE = {
  C2C: '1',
  GROUP: '2',
};

module.exports = MessageInfo;
