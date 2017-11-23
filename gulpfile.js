'use strict';

// 引入 gulp
const gulp = require('gulp');

const path = require('path');

const buildPath = path.join(__dirname, 'build');

gulp.task('config', () => gulp.src(['./src/server/config_master.js'])
  .pipe(gulp.dest(buildPath)));

gulp.task('default', [
  'config',
]);

