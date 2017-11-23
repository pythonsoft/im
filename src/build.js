'use strict';

const path = require('path');
const webpack = require('webpack');
const del = require('del');
const webpackConfig = require('../webpack.config');
const fs = require('fs');
const generateVersionJson = require('./generateVersionJSON');
const exec = require('child_process').exec;

const apiPathFile = path.join(__dirname, './server/apiPath.js');
const socketPathFile = path.join(__dirname, './server/socketPath.js');
const buildPath = path.join(__dirname, '../build');
const initPermissionPath = path.join(__dirname, './server/mongodbScript/initPermissionInfo.js');
const feApiPath = path.join(buildPath, 'api');
const pm2JSONPath = path.join(__dirname, '../pm2.json');
const onlineConfig = path.join(__dirname, './server/config_master_online.js');
const packageJsonPath = path.join(__dirname, '../package.json');

let permissionNames = [];
let permissionPaths = [];
let permissionGroups = [];

del.sync(path.resolve('build'));
del.sync(apiPathFile);
del.sync(socketPathFile);
del.sync(buildPath);

const writeToSocketPATH = function () {
  const socketRootPath = path.join(__dirname, './server/socket');
  const files = fs.readdirSync(socketRootPath);

  fs.appendFileSync(socketPathFile, "'use strict';\n\nmodule.exports = function socketAPI(io) {\n");

  files.forEach((filename) => {
    const fullname = path.join(socketRootPath, filename);
    const stats = fs.statSync(fullname);
    if (stats.isDirectory()) {
      fs.appendFileSync(socketPathFile, `  const ${filename} = require('./socket/${filename}'); \n  new ${filename}(io)\n`);
    }
  });
  fs.appendFileSync(socketPathFile, '};\n');
};

// 读取api接口路径,写入文件
const writeToApiPath = function writeToApiPath() {
  const apiRootPath = path.join(__dirname, './server/api');
  const files = fs.readdirSync(apiRootPath);
  fs.appendFileSync(apiPathFile, "'use strict';\n\nmodule.exports = function api(app) {\n");
  files.forEach((filename) => {
    const fullname = path.join(apiRootPath, filename);
    const stats = fs.statSync(fullname);
    if (stats.isDirectory()) {
      fs.appendFileSync(apiPathFile, `  app.use('/${filename}', require('./api/${filename}'));\n`);
    }
  });
  fs.appendFileSync(apiPathFile, '};\n');
};

const getArrByPattern = function getArrByPattern(codeStr, pattern) {
  const arr = codeStr.match(pattern);
  const newArr = [];
  if (arr) {
    for (let i = 0; i < arr.length; i++) {
      const funcName = arr[i].split(' ')[1];
      newArr.push(funcName);
    }
  }
  return newArr;
};

const writeApiFuncFile = function writeApiFuncFile(filePath, funcName, funcType, funcUrl) {
  const tpl = `api.${funcName} = function ${funcName}(data, scope) {
  return new Promise((resolve, reject) => {
    if (scope) { scope.$progress.start(); }
    axios.${funcType}('${funcUrl}', data).then((response) => {
      if (!response) {
        reject('返回数据格式不正确');
        return false;
      }
      const res = response.data;
      if (res.status === '0') {
        if (scope) { scope.$progress.finish(); }
        return resolve(res);
      }
      if (scope) { scope.$progress.fail(); }
      return reject(res.statusInfo.message);
    }).catch((error) => {
      if (scope) { scope.$progress.fail(); }
      reject(error);
    });
  });
};

`;
  fs.appendFileSync(filePath, tpl);
};

const writeUploadApiFuncFile = function writeApiFuncFile(filePath, funcName, funcType, funcUrl) {
  const tpl = `api.${funcName} = function ${funcName}(param, config) {
  return new Promise((resolve, reject) => {
    axios.${funcType}('${funcUrl}', param, config).then((response) => {
      const res = response.data;
      if (res.status === '0') {
        resolve(res);
      }
      reject(res.statusInfo.message);
    }).catch((error) => {
      reject(error);
    });
  });
};

`;
  fs.appendFileSync(filePath, tpl);
};

const writeGetIconApiFuncFile = function writeApiFuncFile(filePath, funcName, funcType, funcUrl) {
  const tpl = `api.${funcName} = function ${funcName}(id) {
  return axios.defaults.baseURL + '${funcUrl}?objectid=' + id;
};

`;
  fs.appendFileSync(filePath, tpl);
};

const writeFile = function writeFile(origin, targetName) {
  const readStream = fs.createReadStream(origin);
  const writeStream = fs.createWriteStream(path.join(buildPath, targetName));
  readStream.pipe(writeStream);
};

const feName = 'fe';
const umpName = 'ump';
const versionName = 'version.json';

const chaoningCoolie = function (version, cb) {
  const chaoningDeployPath = '/Users/chaoningx/Desktop/ump';
  const chaoningFEprojectPath = '/Users/chaoningx/WebstormProjects/ump-fe';
  const chaoningFEProjectApiPath = path.join(chaoningFEprojectPath, 'src', 'fe', 'api');
  const chaoningFEProjectDistPath = path.join(chaoningFEprojectPath, 'dist');

  const targetFe = path.join(chaoningDeployPath, feName);
  const targetUMP = path.join(chaoningDeployPath, umpName);

  console.log('chaoning coolie running now.');

  del.sync(chaoningDeployPath, { force: true });
  fs.mkdirSync(chaoningDeployPath);

  // 将API文件复制到fe下的API包中
  console.log('build fe project start.');

  exec(`cd ${feApiPath} && cp *.js ${chaoningFEProjectApiPath} && cd ${chaoningFEprojectPath} && npm run build`, (error, stdout, stderr) => {
    if (error) {
      console.error(error);
      return cb && cb(error);
    }

    console.log('build fe project success.');

    exec(`cp -rf ${chaoningFEProjectDistPath} ${targetFe}`, (error, stdout, stderr) => {
      if (error) {
        console.error(error);
        return cb && cb(error);
      }

      console.log(`transfer ${feName} project success.`);

      exec(`cp -rf ${buildPath} ${targetUMP}`, (error, stdout, stderr) => {
        if (error) {
          console.error(error);
          return cb && cb(error);
        }

        console.log(`transfer ${umpName} project success.`);

        exec(`cp ${path.join(buildPath, versionName)} ${chaoningDeployPath}`, (error, stdout, stderr) => {
          if (error) {
            console.error(error);
            return cb && cb(error);
          }

          console.log(`transfer ${versionName} file success.`);

          const formatVersion = version.replace(/\s/g, '');

          exec(`cd ${chaoningDeployPath} && zip -r ${formatVersion}.zip ${feName} ${umpName} ${versionName}`, (error, stdout, stderr) => {
            if (error) {
              console.error(error);
              return cb && cb(error);
            }

            console.log(`zip project success, fileName is ${formatVersion}.zip`);

            return cb && cb(null, 'ok');
          });
        });
      });
    });
  });
};

// gitlab上的版本名称不允许有空格，如果有空格，那么获得版本变更信息将会失败
const deployOnline = function deployOnline(cb) {
  if (process.env.NODE_ENV === 'online') {
    writeFile(pm2JSONPath, 'pm2.json');
    writeFile(onlineConfig, 'config_master.js');
    writeFile(packageJsonPath, 'package.json');

    let version = '';
    process.stdout.write('please input version (ps:1.5.7.0):');

    process.stdin.on('readable', () => {
      let chunk = process.stdin.read();
      if (chunk !== null) {
        chunk = chunk.toString().trim();

        if (chunk === 'start') {
          process.stdout.write(`start generate ${versionName} file...\n`);
          generateVersionJson.create(version, buildPath, (err, tpl) => {
            if (err) {
              console.error(err);
              process.stdout.write('please input \'start\' to retry ? \n');
              return false;
            }
            process.stdout.write(`generate ${versionName} success`);

            chaoningCoolie(version, (err, r) => cb && cb(err, r));
          });
        } else {
          version = `version${chunk}`;
          process.stdout.write(`version is : ${version} ${chunk}\n`);
          process.stdout.write('make sure this version is you want, input \'start\' word to continue ? ');
        }
      }
    });
  } else {
    return cb && cb(null, 'ok');
  }
};

// 读取后端接口生成前端调用的函数文件
const generateFeApiFuncFile = function generateFeApiFuncFile() {
  const apiRootPath = path.join(__dirname, './server/api');
  const files = fs.readdirSync(apiRootPath);
  fs.mkdirSync(buildPath);
  fs.mkdirSync(feApiPath);

  files.forEach((filename) => {
    const fullname = path.join(apiRootPath, filename);
    const stats = fs.statSync(fullname);
    if (stats.isDirectory()) {
      const indexFile = path.join(fullname, 'index.js');
      const codeStr = fs.readFileSync(indexFile, 'utf8');
      const funcNameArr = getArrByPattern(codeStr, /@apiName: (.*)/g);
      const funcTypeArr = getArrByPattern(codeStr, /@apiFuncType: (.*)/g);
      const funcUrlArr = getArrByPattern(codeStr, /@apiFuncUrl: (.*)/g);

      const tempPermissionNames = getArrByPattern(codeStr, /@permissionName: (.*)/g);
      const tempPermissionPaths = getArrByPattern(codeStr, /@permissionPath: (.*)/g);
      const tempPermissionGroups = getArrByPattern(codeStr, /@permissionGroup: (.*)/g);

      permissionNames = permissionNames.concat(tempPermissionNames);
      permissionPaths = permissionPaths.concat(tempPermissionPaths);
      permissionGroups = permissionGroups.concat(tempPermissionGroups);
      if (tempPermissionNames.length !== tempPermissionPaths.length || tempPermissionNames.length !== tempPermissionGroups.length) {
        throw new Error(`${filename}注释有问题`);
      }

      if (funcNameArr.length !== funcTypeArr.length || funcNameArr.length !== funcUrlArr.length) {
        throw new Error('funcNameArr cannot match funcTypeArr length or funcUrlArr length');
      }

      if (funcNameArr.length > 0) {
        const filePath = path.join(feApiPath, `${filename}.js`);
        const tpl = `const api = {};
const axios = require('../config');

`;
        fs.appendFileSync(filePath, tpl);
        for (let i = 0; i < funcNameArr.length; i++) {
          if (funcUrlArr[i] === '/upload' || funcUrlArr[i] === '/upload/uploadWatermark') {
            writeUploadApiFuncFile(filePath, funcNameArr[i], funcTypeArr[i], funcUrlArr[i]);
          } else if (funcUrlArr[i] === '/media/getIcon' || funcUrlArr[i] === '/template/getWatermark') {
            writeGetIconApiFuncFile(filePath, funcNameArr[i], funcTypeArr[i], funcUrlArr[i]);
          } else {
            writeApiFuncFile(filePath, funcNameArr[i], funcTypeArr[i], funcUrlArr[i]);
          }
        }
        fs.appendFileSync(filePath, 'module.exports = api;\n');
      }
    }
  });
};

const initPermissionInfo = function initPermissionInfo() {
  permissionNames.push('所有权限');
  permissionGroups.push('root');
  permissionPaths.push('all');

  console.log('write permission files');
  const data = fs.readFileSync(initPermissionPath, 'utf8');
  let result = data.replace(/const permissionNames = .*/g, `const permissionNames = ${JSON.stringify(permissionNames)}`);
  result = result.replace(/const permissionPaths = .*/g, `const permissionPaths = ${JSON.stringify(permissionPaths)}`);
  result = result.replace(/const permissionGroups = .*/g, `const permissionGroups = ${JSON.stringify(permissionGroups)}`);
  fs.writeFileSync(initPermissionPath, result, 'utf8');
};

// generateFeApiFuncFile();

writeToApiPath();

writeToSocketPATH();

// initPermissionInfo();

webpack(webpackConfig, (err, stats) => {
  if (err) {
    // Handle errors here
    throw new Error(JSON.stringify(err.errors));
  } else if (stats.hasErrors()) {
    throw new Error(stats.compilation.errors);
  }
  console.log('server webpack completely...');

  if (process.env.NODE_ENV !== 'online') {
    require('./runGulp')(() => {
      process.exit(0);
    });
  } else {
    deployOnline((err) => {
      if (!err) {
        process.exit(0);
      }
    });
  }
});
