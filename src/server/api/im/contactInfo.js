/**
 * Created by chaoningx on 17/11/12.
 */

'use strict';

const DB = require('../../common/db');
const config = require('../../config');
const uuid = require('uuid');

// 通讯录
class ContactInfo extends DB {
  constructor() {
    super(config.dbInstance[`${config.dbName}DB`], 'IM_ContactInfo');

    this.struct = {
      _id: { type: 'string', validation: 'require', default() { return uuid.v1(); } },
      targetId: { type: 'string', validation: 'require' }, // 如为人，则为人的ID，如果为群，那为sessionId
      targetName: { type: 'string', validation: 'require' }, // 好友的名称，群的名称
      photo: { type: 'string' },
      type: { type: 'string',
        allowUpdate: false,
        validation(v) {
          let flag = false;

          for (const k in ContactInfo.TYPE) {
            if (v === ContactInfo.TYPE[k]) {
              flag = true;
            }
          }

          return flag;
        },
        default: () => ContactInfo.TYPE.C2C },
      ownerId: { type: 'string', validation: 'require' },
      createdTime: { type: 'date', validation: 'require', allowUpdate: false },
      modifyTime: { type: 'date', validation: 'require' },
      fromWhere: { type: 'string' },
      details: { type: 'object' },
    };
  }
}

ContactInfo.TYPE = {
  PERSON: '0', // 人
  NORMAL_GROUP: '1', // 群
  TRANSFER_BOX: '2', // 传输盒子
};

module.exports = ContactInfo;
