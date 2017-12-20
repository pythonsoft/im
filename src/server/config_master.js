config.host = 'localhost:9000';
config.domain = `http://${config.host}`;

config.dbName = 'im';

config.mongodb = {
  // [`${config.dbName}URL`]: `mongodb://localhost:27017/${config.dbName === 'ump' ? 'ump_v1' : 'ump_test'}`,
  [`${config.dbName}URL`]: `mongodb://10.0.15.62:27017/${config.dbName === 'im' ? 'im_ump_v1' : 'im_ump_test'}`,
};

config.redis_host = '10.0.15.69';
// config.redis_host = 'localhost';
config.redis_port = 6379;
config.redis_opts = { auth_pass: 'phoenixtv2017' };

// 日志路径
config.logPath = path.join(__dirname, '../logs/');

// path for uploading files
config.uploadPath = path.join(__dirname, '../../uploads/');

// 允许跨域访问的地址列表
config.whitelist = [
  'http://localhost:8000',
  'http://10.0.15.105:8000',
  'http://10.0.15.101:8000',
  'http://ump.szdev.cn',
  'http://api.szdev.cn',
  'http://localhost.szdev.cn:8000',
];

config.secret = {
  yunXiang: 'BRYSJHHRHLYQQLMG',
  ump: 'secret',
};
