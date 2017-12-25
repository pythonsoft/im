'use strict';

module.exports = {
  loginCannotFindUser: {
    code: '-3001',
    message: '登录时找不到用户',
  },
  notLogin: {
    code: '-3002',
    message: '用户没有登录',
  },
  loginExpired: {
    code: '-3003',
    message: '登录已过期',
  },
  loginCannotGetUserInfo: {
    code: '-3004',
    message: '登录找不到用户信息',
  },
  needReLogin: {
    code: '-3005',
    message: '需要重新登录',
  },
  noAccess: {
    code: '-4001',
    message: '无权访问此接口',
  },
  databaseError: {
    code: '-1',
    message: '数据库异常.',
  },
  databaseErrorDetail: {
    code: '-2',
    message: '{{error}}',
  },
  typeError: {
    code: '-10001',
    message: '{{field}} 输入类型错误',
  },
  requireError: {
    code: '-10002',
    message: '必须填写 {{field}}',
  },
  validationError: {
    code: '-10003',
    message: '{{field}} 不符合验证规则',
  },
  fieldIsNotExistError: {
    code: '-10004',
    message: '{{field}} 字段不在实体类中，无法进行存取操作',
  },
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
  },
  imContactIsExist: {
    code: '-160020',
    message: '联系人已经存在',
  },
  downloadURLIsNull: {
    code: '-170000',
    message: '下载参数url为空',
  },
  fileIsNotExist: {
    code: '-170001',
    message: '下载文件不存在',
  },
  downloadPathInvalid: {
    code: '-170002',
    message: '下载路径非法',
  },
};
