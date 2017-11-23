/**
 * Created by steven on 17/11/12.
 */

'use strict';

const DB = require('../../common/db');
const config = require('../../config');
const utils = require('../../common/utils');
const uuid = require('uuid');

class AccountInfo extends DB {
  constructor() {
    super(config.dbInstance[`${config.dbName}DB`], 'IM_AccountInfo');

    this.struct = {
      _id: { type: 'string', default() { return uuid.v1(); }, validation: 'require', allowUpdate: false },
      name: { type: 'string' },
      createdTime: { type: 'date', validation: 'require', allowUpdate: false },
      email: { type: 'string', validation: utils.checkEmail },
      photo: { type: 'string' },
      strangerAuthorizeType: { type: 'string', validation(v) {
        let flag = false;

        for (const k in AccountInfo.TYPE) {
          if (v === AccountInfo.TYPE[k]) {
            flag = true;
          }
        }

        return flag;
      }, default() { return AccountInfo.STRANGER_AUTHORIZE_TYPE.OPEN } },
      detail: { type: 'object' },
      description: { type: 'string' },
    };
  }

}

AccountInfo.STRANGER_AUTHORIZE_TYPE = {
  OPEN: '1', //直接添加，不需要任何的验证
  NEED_APPROVE: '2' // 需要验证
};

module.exports = AccountInfo;
