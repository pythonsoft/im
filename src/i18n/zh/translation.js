'use strict';

module.exports = {
  imSessionFieldsIsNull: {
    code: '-160001',
    message: '会话参数 {{field}} 为空',
  },
  imMemberMustBeArray: {
    code: '-160002',
    message: 'members参数类型必须为Array',
  },
  imMemberIsNotExist: {
    code: '-160003',
    message: '当前用户不存在',
  },
  imSessionIsNotExist: {
    code: '-160004',
    message: '当前会话不存在',
  },
  imMemberHasBeenSession: {
    code: '-160005',
    message: '此用户已在当前会话中',
  },
  imUserIsNotExist: {
    code: '-160006',
    message: '用户不存在',
  },
  imAccountFieldsIsNull: {
    code: '-160007',
    message: '对帐户操作时，参数 {{field}} 不正确',
  },
  imContactFieldsIsNull: {
    code: '-160008',
    message: '对通讯录操作时，参数 {{field}} 不正确',
  },
  imMessageFieldsIsNull: {
    code: '-160009',
    message: '对消息操作时，参数 {{field}} 不正确',
  },
  imLoginDateExpire: {
    code: '-160010',
    message: '登录过期',
  },
  imAuthorizeInvalid: {
    code: '-160011',
    message: '验证失败',
  },
  imAuthorizeInHeadInvalid: {
    code: '-160012',
    message: '验证信息没有在request头部出现',
  },
  imMessageContentIsNull: {
    code: '-160013',
    message: '消息内容不能为空',
  },
  imMessageContentTooLong: {
    code: '-160014',
    message: '单条信息内容长度不能超过1000',
  },
  imMessageTypeIsNotExist: {
    code: '-160015',
    message: '消息类型不存在',
  },
  imMessageFieldsIsInvalid: {
    code: '-160016',
    message: '非法参数, {{field}}',
  },
  imActivityFieldsIsNull: {
    code: '-160017',
    message: '参数不正确, {{ field }}',
  },
  imActivityIsNotExist: {
    code: '-160018',
    message: '当前用户活动记录不存在',
  },
  imUserIsExist: {
    code: '-160019',
    message: '用户已存在',
  }
};
