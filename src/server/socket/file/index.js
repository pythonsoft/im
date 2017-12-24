/**
 * Created by chaoningxie on 2016/12/10.
 */
const fs = require('fs');
const path = require('path');
const socketStream = require('socket.io-stream');
const crypto = require('crypto');
const utils = require('../../common/utils');
const loginMiddleware = require('../../middleware/login');

const config = require('../../config');
const redisMQ = require('./redisMQ');
const STORAGE_PATH = config.uploadPath;
const isStorageExist = fs.existsSync(STORAGE_PATH);

const mediaExpressAPI = require('../../module/mediaExpress');
const umpAPI = require('../../module/ump');

const factoryInterface = function(key) {
  const interfaces = {
    'mediaexpress': mediaExpressAPI,
    'ump': umpAPI
  };

  return interfaces[key];
};

if (!isStorageExist) {
  utils.console('storage dir created');
  fs.mkdirSync(STORAGE_PATH);
}

const STATUS = {
  ready: 1,
  start: 2,
  transfer: 3,
  transferSuccess: 4,
  composeStart: 5,
  compose: 6,
  composeSuccess: 7,
  composeError: 8,
  removePackagePartStart: 9,
  removePackagePart: 10,
  removePackageSuccess: 11,
  removePackageError: 12,
  success: 999,
  error: 1000,
};

const isGetAllPackage = function (task) {
  if (!task) {
    throw new Error('task is not exist.');
  }

  const order = task.data.order;
  const acceptPackagePart = task.acceptPackagePart;
  let flag = true;

  for (let i = 0, len = order.length; i < len; i++) {
    if (!acceptPackagePart[order[i]]) {
      flag = false;
      break;
    }
  }

  return flag;
};

const composeFile = function (task, successFn) {
  const taskId = task.data._id;

  if (!task) {
    throw new Error('task is not exist.');
  }

  const order = task.data.order;
  const name = task.data.name.replace(/[\\\/:*?"<>|”]/img, '_');
  const filePath = path.join(STORAGE_PATH, taskId, name);
  const len = order.length;

  updateStatus(task, STATUS.composeStart);

  const writeFile = function (index, start) {
    const packagePartId = order[index];
    const packageInfo = task.acceptPackagePart[packagePartId];
    const ws = fs.createWriteStream(filePath, { start, flags: start > 0 ? 'r+' : 'w', encoding: 'binary' });
    const fp = path.join(STORAGE_PATH, taskId, packagePartId);
    const rs = fs.createReadStream(fp);

    ws.on('error', (err) => {
      utils.console('write file to storage fail', err);
      updateStatus(task, STATUS.composeError, err);
    });

    ws.on('finish', () => {
      if (index < len - 1) {
        updateStatus(task, STATUS.compose);
        writeFile(index + 1, start + packageInfo.size);
      } else {
        task.filePath = filePath;
        updateStatus(task, STATUS.composeSuccess);
        utils.console('compose file success');
        successFn && successFn();
      }
    });

    rs.pipe(ws);
  };

  writeFile(0, 0);
};

const removePackageParts = function (task, callback) {
  const taskId = task.data._id;

  if (!task) {
    throw new Error('task is not exist.');
  }

  const order = task.data.order;
  const del = function (index) {
    const partId = order[index];

    if (!partId) {
      utils.console('remove package parts success');
      updateStatus(task, STATUS.removePackageSuccess);
      callback && callback();
      return false;
    }

    const fp = path.join(STORAGE_PATH, taskId, partId);

    if (fs.existsSync(fp)) {
      updateStatus(task, STATUS.removePackagePart);
      fs.unlinkSync(fp);
    }

    del(index + 1);
  };

  updateStatus(task, STATUS.removePackagePartStart);
  del(0);
};

const invalidRequest = function (socket, message) {
  socket.emit('invalid_request', message);
  socket.disconnect();
};

let updateStatus = function (task, status, errorMessage) {
  task.status = status;

  if (status === STATUS.error || status === STATUS.composeError || status === STATUS.removePackageError) {
    task.error = errorMessage.message ? errorMessage.message : errorMessage.toString();
  }

  if (status === STATUS.success) {
    //todo

  }
};

class FileIO {
  constructor(io) {
    const fileIO = io.of('/file');

    // / authorize
    fileIO.use((socket, next) => {
      const rs = loginMiddleware.webSocketMiddleware(socket);

      if (rs.status === '0') {
        const data = rs.data;
        socket.info = data.info;
        socket.task = data.task;
        next();
      } else {
        socket.emit('error', rs.result);
        socket.disconnect();
      }
    });

    fileIO.on('connection', (socket) => {
      utils.console('file connection', socket.id);

      let passedLength = 0;
      let isConnect = true;
      let stop = false;
      let transferStartTime = 0;

      const showProcess = function () {
        const taskData = socket.task.data;
        const totalSize = taskData.size;
        const startTime = Date.now();
        const interval = 5000;

        let lastSize = 0;

        const show = function () {
          let percent = Math.ceil((passedLength / totalSize) * 100);
          const averageSpeed = (passedLength - lastSize) / interval * 1000;

          if (percent > 100) {
            percent = 100;
          }

          lastSize = passedLength;
          utils.processWrite(`任务(${taskData.name} - ${taskData._id})已接收${utils.formatSize(passedLength)}, ${percent}%, 平均速度：${utils.formatSize(averageSpeed)}/s`);

          if (passedLength >= totalSize) {
            console.log(`共用时：${(Date.now() - startTime) / 1000}秒`);
          } else {
            if (!isConnect) {
              utils.processWrite('---- disconnect ----');
              return false;
            }
            setTimeout(() => {
              show();
            }, interval);
          }
        };

        show();
      };

      socket.on('headerPackage', (data) => {
        if(!data || utils.isEmptyObject(data)) {
          invalidRequest(socket, 'header package data is invalid');
          return false;
        }

        if(typeof data._id === 'undefined' || typeof data.size === 'undefined' || typeof data.name === 'undefined') {
          invalidRequest(socket, 'header package data must include param _id name size');
          return false;
        }

        console.log('socket header package -->', socket.task);

        if (socket.task._id === data._id) {
          invalidRequest(socket, 'ignore task which exist.');
          return false;
        }

        if (!data.name) {
          invalidRequest(socket, 'this package name is null.');
          return false;
        }

        utils.console('accept header package', data);
        utils.console('socket.info.queueName', socket.info.queueName);

        data.type = 'create';

        const mainTaskInfo = {
          data,
          targetDir: path.join(STORAGE_PATH, data._id),
          status: STATUS.start,
          acceptPackagePart: {},
          filePath: '',
          error: '',
          socketId: socket.id,
        };

        //创建上传任务回调调用
        factoryInterface(socket.info.key).createTask(socket, mainTaskInfo, (err, rs) => {
          if (err) {
            socket.emit('error', err);
            socket.disconnect();
            return false;
          }

          utils.console('socket id map', socket.info);

          fs.mkdirSync(path.join(mainTaskInfo.targetDir));
          socket.task =  Object.assign({}, mainTaskInfo);
          socket.emit('transfer_start');
          transferStartTime = Date.now();

          showProcess();
        });

      });

      socket.on('error', (err) => {
        utils.console(`socket error socket id: ${socket.id}`, err);
        socket.disconnect();
        updateStatus(socket.task, STATUS.error, err);
      });

      socket.on('disconnect', () => {
        isConnect = false;
        utils.console(`disconnect with client :${socket.id}`);
      });

      socket.on('stop', (data)=> {
        data.type = 'stop';
        stop = false;
      });

      socket.on('restart', ()=>{
        socket.emit('transfer_package_finish', '');
      });

      socketStream(socket).on('fileStream', (stream, data) => {
        const task = socket.task;

        if (!task) {
          invalidRequest(socket, 'file stream accept data invalid.');
        }

        const filename = path.join(task.targetDir, data._id);
        const writeStream = fs.createWriteStream(filename);
        updateStatus(socket.task, STATUS.transfer);

        writeStream.on('finish', () => {
          const type = stop ? 'stop': 'transfer';

          if (data.status === STATUS.error) {
            fs.unlinkSync(filename);
            data.type = 'error';
            updateStatus(socket.task, STATUS.error, data.error);
            socket.emit('transfer_package_error', data);
            return false;
          }

          socket.task.acceptPackagePart[data._id] = data;
          data.type = type;

          socket.emit('transfer_package_success', data);
          socket.emit('transfer_package_finish', data);

          if (isGetAllPackage(socket.task)) {
            // get all package and compose file
            const totalSize = socket.task.data.size;
            const totalTime = Date.now() - transferStartTime;

            data.type = 'complete';
            data.speed = totalTime ? utils.formatSize(totalSize*1000/totalTime) + '/s' : '';

            console.log('speed -->', data);
            redisMQ.sendMessage(socket.info.queueName, data);
            updateStatus(socket.task, STATUS.success);

            socket.emit('complete', '');
            socket.disconnect();

            utils.console('compose file');
            composeFile(socket.task, () => {
              removePackageParts(socket.task, () => {
                updateStatus(socket.task, STATUS.success);
              });
            });
          }
        });

        writeStream.on('error', (err) => {
          data.status = STATUS.error;
          data.error = err;
          updateStatus(socket.task, STATUS.error, err, socket.info.queueName, data);
        });

        stream.on('data', (chunk) => {
          passedLength += chunk.length;
        });

        if (socket.info.secret) {
          const decipher = crypto.createDecipher('aes192', socket.info.cryptoKey);
          stream.pipe(decipher).pipe(writeStream);
        } else {
          stream.pipe(writeStream);
        }
      });
    });
  }
}

module.exports = FileIO;

