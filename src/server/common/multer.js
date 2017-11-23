'use strict';

const multer = require('multer');

const config = require('../config');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, config.uploadPath);
  },
  filename(req, file, cb) {
    const fileFormat = (file.originalname).split('.');
    let fileExt = '';
    let filename = '';
    if (fileFormat.length < 2) {
      fileExt = 'jpeg';
      filename = file.originalname;
    } else {
      fileExt = fileFormat[fileFormat.length - 1];
      filename = fileFormat[0];
    }
    cb(null, `${filename}-${Date.now()}.${fileExt}`);
  },
});

const upload = multer({ storage });

module.exports = { upload };
