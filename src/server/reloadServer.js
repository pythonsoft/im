/**
 * Created by steven on 2017/6/26.
 */

'use strict';

const path = require('path');

const cp = require('child_process');

const chokidar = require('chokidar');

const watcher = chokidar.watch([path.join(__dirname, '../server'), path.join(__dirname, '../i18n')]);

let appIns = cp.fork(require('path').join(__dirname, './app.js'));

function reload(appIns) {
  appIns.kill('SIGINT');
  return cp.fork(require('path').join(__dirname, './app.js'));
}

watcher.on('ready', () => {
  watcher.on('change', () => {
    console.log('<---- watched file change, do something ---->');

    appIns = reload(appIns);
  });

  watcher.on('add', () => {
    console.log('<---- watched new file add, do something ---->');

    appIns = reload(appIns);
  });

  watcher.on('unlink', () => {
    console.log('<---- watched file remove, do something ---->');

    appIns = reload(appIns);
  });
});

process.on('SIGINT', () => {
  process.exit(0);
});
