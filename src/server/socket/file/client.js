/**
 * Created by chaoningxie on 2016/12/10.
 */
const fs = require('fs');
const utils = require('../../common/utils');
const clientConnect = require('socket.io-client');
const socketStreamClient = require('socket.io-stream');
const crypto = require('crypto');
const TransferTask = require('./transferTask');

const config = require('../../config');

class FileClient {
  constructor(options) {
    this.settings = Object.assign({
      host: 'localhost',
      port: 8090,
      key: config.secret.ump,
      userId: 'chaoningx@gmail.com',
      isCrypto: true,
      filePath: '/Users/chaoningxie/Downloads/ubuntu-16.04-server-amd64.iso',
      concurrency: 5,
    }, options);

    this.transferTaskInstance = null;
    this.isConnect = false;
    this.passedLength = 0;
    this.socket = null;
  }

  transfer() {
    const me = this;

    me.connectState();
    me.showProcess(me.settings.filePath);

    const socket = clientConnect(`http://${me.settings.host}:${me.settings.port}/file`, {
      extraHeaders: {
        'im-ticket': utils.cipher(`${me.settings.userId}-${me.settings.isCrypto ? 1 : 0}`, me.settings.key),
        'im-key': 'ump',
      },
    });

    this.socket = socket;

    socket.on('connect', () => {
      const task = new TransferTask({ filePath: me.settings.filePath });
      task.socketId = socket.id;
      socket.emit('headerPackage', task.headerPackage);
      me.transferTaskInstance = task;
      utils.console('socket connect, socket id blow ', me.getSocketId());
      me.isConnect = true;
    });

    socket.on('transfer_start', () => {
      me.sendPartOfFilePackage();
    });

    socket.on('transfer_package_success', (data) => {
      me.transferTaskInstance.setSuccessPackage(data._id);
    });

    socket.on('transfer_package_error', (data) => {
      me.transferTaskInstance.setFailPackage(data._id, data.error);
    });

    socket.on('transfer_package_finish', (data) => {
      me.sendPartOfFilePackage();
    });

    socket.on('invalid_request', (msg) => {
      utils.console(`invalid_request socket id: ${me.getSocketId()}`, msg);
    });

    socket.on('complete', () => {
      utils.console('file transfer complete');
    });

    socket.on('error', (err) => {
      utils.console(`error socket id: ${me.getSocketId()}`, err);
      process.exit();
    });

    socket.on('disconnect', (msg) => {
      utils.console(`disconnect with server${me.getSocketId()}`, msg);
      process.exit();
    });
  }

  connectState() {
    const me = this;
    const fn = function (count) {
      utils.processWrite(`正在连接服务器(${me.settings.host}:${me.settings.port})...${count}`);
      if (!me.isConnect) {
        setTimeout(() => {
          fn(count + 1);
        }, 1000);
      }
    };

    fn(1);
  }

  getSocketId() {
    return this.transferTaskInstance ? this.transferTaskInstance.socketId : '';
  }

  showProcess(filePath) {
    const me = this;
    const stat = fs.statSync(filePath);
    const totalSize = stat.size;
    let lastSize = 0;
    const startTime = Date.now();
    const interval = 5000;

    const show = function () {
      const percent = Math.ceil((me.passedLength / totalSize) * 100);
      const averageSpeed = (me.passedLength - lastSize) / interval * 1000;

      lastSize = me.passedLength;
      utils.processWrite(`已完成${utils.formatSize(me.passedLength)}, ${percent}%, 平均速度：${utils.formatSize(averageSpeed)}/s`);

      if (me.passedLength >= totalSize) {
        console.log(`共用时：${(Date.now() - startTime) / 1000}秒`);
      } else {
        setTimeout(() => {
          show();
        }, interval);
      }
    };

    show();
  }

  sendPartOfFilePackage() {
    let hasTask = true;
    const me = this;

    const createTask = function (index) {
      if (!hasTask) { return false; }
      const pkg = me.transferTaskInstance.getPackage();

      if (pkg === 'done') {
        hasTask = false;
        utils.console('transfer complete');
      } else if (pkg) {
        if (index < me.settings.concurrency) {
          setImmediate(createTask, index + 1);
        }
        const stream = socketStreamClient.createStream();
        socketStreamClient(me.socket).emit('fileStream', stream, pkg.packageInfo);

        pkg.stream.on('data', (chunk) => {
          me.passedLength += chunk.length;
        });
        if (me.settings.isCrypto) {
          const cipher = crypto.createCipher('aes192', me.settings.key);
          pkg.stream.pipe(cipher).pipe(stream);
        } else {
          pkg.stream.pipe(stream);
        }
      } else {
        hasTask = false;
        // utils.console('all the task is running');
      }
    };

    createTask(0);
  }
}

const fc = new FileClient({
  host: '10.0.15.156',
  port: 9000,
  filePath: '/Users/steven/Downloads/WebStorm-2016.3.6.dmg',
  concurrency: 5, // 并发
  userId: 'chaoningx',
});
fc.transfer();

module.exports = FileClient;
