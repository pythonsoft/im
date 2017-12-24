const config = {};

config.STATUS = {
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
  stop: 13,
  success: 999,
  error: 1000,
};



module.exports = config;