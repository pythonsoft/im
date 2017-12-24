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
const fileConfig = require('./config');
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

const STATUS = fileConfig.STATUS;

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

const composeFile = function (socket, successFn) {
  const task = socket.task;
  const taskId = task.data._id;

  if (!task) {
    throw new Error('task is not exist.');
  }

  const order = task.data.order;
  const name = task.data.name.replace(/[\\\/:*?"<>|”]/img, '_');
  const filePath = path.join(STORAGE_PATH, taskId, name);
  const len = order.length;

  // updateStatus(socket, STATUS.composeStart);

  const writeFile = function (index, start) {
    const packagePartId = order[index];
    const packageInfo = task.acceptPackagePart[packagePartId];
    const ws = fs.createWriteStream(filePath, { start, flags: start > 0 ? 'r+' : 'w', encoding: 'binary' });
    const fp = path.join(STORAGE_PATH, taskId, packagePartId);
    const rs = fs.createReadStream(fp);

    ws.on('error', (err) => {
      utils.console('write file to storage fail', err);
      updateStatus(socket, STATUS.composeError, err);
    });

    ws.on('finish', () => {
      if (index < len - 1) {
        // updateStatus(socket, STATUS.compose);
        writeFile(index + 1, start + packageInfo.size);
      } else {
        task.filePath = filePath;
        // updateStatus(socket, STATUS.composeSuccess);
        utils.console('compose file success');
        successFn && successFn();
      }
    });

    rs.pipe(ws);
  };

  writeFile(0, 0);
};

const removePackageParts = function (socket, callback) {
  const task = socket.task;
  const taskId = task.data._id;

  if (!task) {
    throw new Error('task is not exist.');
  }

  const order = task.data.order;
  const del = function (index) {
    const partId = order[index];

    if (!partId) {
      utils.console('remove package parts success');
      // updateStatus(socket, STATUS.removePackageSuccess);
      callback && callback();
      return false;
    }

    const fp = path.join(STORAGE_PATH, taskId, partId);

    if (fs.existsSync(fp)) {
      // updateStatus(socket, STATUS.removePackagePart);
      fs.unlinkSync(fp);
    }

    del(index + 1);
  };

  // updateStatus(socket, STATUS.removePackagePartStart);
  del(0);
};

const invalidRequest = function (socket, message) {
  socket.emit('invalid_request', message);
  socket.disconnect();
};

let updateStatus = function (socket, status, result) {
  const task = socket.task;
  task.status = status;

  if (status === STATUS.error || status === STATUS.composeError || status === STATUS.removePackageError) {
    task.error = result.message ? result.message : result.toString();
  }

  factoryInterface(socket.info.key).update(socket.info, status, {}, socket.callbackResult, err => {
    if(err) {
      console.log('update error -->', err);
    }
  });

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
        const interval = 3000;

        let lastSize = 0;

        const show = function () {
          let percent = Math.ceil((passedLength / totalSize) * 100);
          const averageSpeed = (passedLength - lastSize) / interval * 1000;

          if (percent > 100) {
            percent = 100;
          }

          lastSize = passedLength;

          utils.processWrite(`任务(${taskData.name} - ${taskData._id})已接收${utils.formatSize(passedLength)}, ${percent}%, 平均速度：${utils.formatSize(averageSpeed)}/s`);

          const avs = passedLength >= totalSize ? totalSize / ((Date.now() - startTime) / 1000) : averageSpeed;
          const postData = {
            progress: percent,
            speed: utils.formatSize(avs) + '/s'
          };
          //这里使用的是定时器，更新会有延迟，会导至状态不正常，所以这里不更新状态
          factoryInterface(socket.info.key).update(socket.info, '', postData, socket.callbackResult, (err, r) => {
            if(err) {
              console.log('update error -->', err);
            }
          });

          socket.emit('transfer_progress', Object.assign({
            callbackResult: socket.callbackResult
          }, postData));

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
        factoryInterface(socket.info.key).create(socket.info, mainTaskInfo, (err, rs) => {
          if (err) {
            socket.emit('error', err.toString());
            socket.disconnect();
            return false;
          }

          utils.console('socket id map', socket.info);
          utils.console('factoryInterface create', rs);

          fs.mkdirSync(path.join(mainTaskInfo.targetDir));
          socket.task =  Object.assign({}, mainTaskInfo);
          //返回结果挂到socket对象
          socket.callbackResult = rs;
          socket.emit('transfer_start', rs);
          transferStartTime = Date.now();
          updateStatus(socket, STATUS.transfer);
          showProcess();
        });

      });

      socket.on('error', (err) => {
        utils.console(`socket error socket id: ${socket.id}`, err);
        socket.disconnect();
        updateStatus(socket, STATUS.error, err);
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

        // updateStatus(socket, STATUS.transfer);

        writeStream.on('finish', () => {
          const type = stop ? 'stop': 'transfer';

          if (data.status === STATUS.error) {
            fs.unlinkSync(filename);
            data.type = 'error';
            updateStatus(socket, STATUS.error, data.error);
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

            redisMQ.sendMessage(socket.info.queueName, data);
            // updateStatus(socket, STATUS.success);
            // socket.emit('complete', '');
            // socket.disconnect();

            utils.console('compose file');
            composeFile(socket, () => {
              removePackageParts(socket, () => {
                updateStatus(socket, STATUS.success);
                socket.emit('complete', '');
                socket.disconnect();
              });
            });
          }
        });

        writeStream.on('error', (err) => {
          data.status = STATUS.error;
          data.error = err;
          // updateStatus(socket, STATUS.error, err, socket.info.queueName, data);
          updateStatus(socket, STATUS.error, err);
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

