config.host = 'localhost:9000';
config.domain = `http://${config.host}`;

config.dbName = 'im';

config.mongodb = {
  [`${config.dbName}URL`]: `mongodb://10.0.15.62:27017/${config.dbName === 'im' ? 'im_v1' : 'im_test'}`,
};

config.redis_host = '10.0.15.69';
config.redis_port = 6379;
config.redis_opts = { auth_pass: 'phoenixtv2017' };

// 日志路径
config.logPath = path.join(__dirname, '../logs/');

// path for uploading files
config.uploadPath = path.join(__dirname, '../../uploads/');

