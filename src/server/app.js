
'use strict';

const path = require('path');
const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoClient = require('mongodb').MongoClient;
const config = require('./config');
const i18nMiddleware = require('./middleware/i18n');
const cors = require('cors');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const redis = require('redis').createClient;
const adapter = require('socket.io-redis');

const pub = redis(config.redis_port, config.redis_host, config.redis_opts);
const sub = redis(config.redis_port, config.redis_host, config.redis_opts);
io.adapter(adapter({ pubClient: pub, subClient: sub }));

pub.on('error', (err) => {
  console.log(`Redis pub Error: ${err}`);
});

pub.on('ready', () => {
  console.log('Redis pub Connect Success!');
});

sub.on('error', (err) => {
  console.log(`Redis sub Error: ${err}`);
});

sub.on('ready', () => {
  console.log('Redis sub Connect Success!');
});

const corsOptions = {
  origin(origin, callback) {
    if (typeof origin === 'undefined' || config.whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true);
      // callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // 允许跨域携带cookie
};

app.use(cors(corsOptions));
app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json({ limit: '3mb' })); // for parsing application/json
app.use(bodyParser.urlencoded({ limit: '3mb', extended: true })); // for parsing application/x-www-form-urlencoded
app.use('/', express.static(path.resolve('build', 'public')));

app.use(i18nMiddleware);

const initMongodb = function initMongodb(names, completeFn) {
  /* eslint-disable consistent-return */
  const init = function init(index) {
    const name = names[index];
    if (!name) {
      return completeFn && completeFn();
    }
    mongoClient.connect(config.mongodb[`${name}URL`], {
      autoReconnect: true,
      poolSize: 10,
    }, (err, db) => {
      if (err) {
        throw new Error(err);
      }
      config.dbInstance[`${name}DB`] = db;
      init(index + 1);
      console.log(`connect mongodb: ${name} success!`);
      return false;
    });
  };
  /* eslint-enable consistent-return */

  init(0);
};

const runServer = function runServer(dbName = config.dbName) {
  initMongodb([dbName], () => {
    server.listen(config.port, () => {
      require('./apiPath.js')(app); // eslint-disable-line
      require('./socketPath.js')(io); // eslint-disable-line
      require('./mongodbScript/index');
      require('./setTimeOutJob/index');

      console.log(`Listening on port ${config.port}...`);
    });
  });
};

if (process.env.NODE_ENV === 'development') {
  runServer();

  // initialize swagger-jsdoc
  const swaggerOptions = {
    swaggerDefinition: {
      info: {
        title: 'API',
        version: '1.0.0',
        description: 'Testing how to describe a RESTful API with Swagger',
      },
      host: config.host,
      basePath: '/',

    },
    // TODO: import apis as below
    apis: [
      './**/api/*/*.js',
      './**/common/*.js',
    ],
  };
  const swaggerJSDoc = require('swagger-jsdoc');
  const swaggerUi = require('swagger-ui-express');
  const swaggerSpec = swaggerJSDoc(swaggerOptions);

  // set swagger-ui-express
  const showExplorer = true;
  const swaggerUiOptions = {};
  const swaggerUiCss = '';

  // import rests
  app.get('/api-docs.json', (req, res) => {
    res.set({
      'Content-Type': 'application/json',
    });
    res.send(swaggerSpec);
  });
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, showExplorer, swaggerUiOptions, swaggerUiCss));
  require('./../runGulp')();
} else {
  runServer(config.dbName);
}

module.exports = app;
