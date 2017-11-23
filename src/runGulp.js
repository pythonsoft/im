'use strict';

const spawn = require('child_process').spawn;

const runGulp = function runGulp(done) {
  const g = spawn(process.platform === 'win32' ? 'gulp.cmd' : 'gulp', ['default']);
  g.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  g.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  g.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    return done && done();
  });
};

module.exports = runGulp;
