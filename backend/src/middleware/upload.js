const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const multer = require('multer');
const { storageDir, maxUploadSize } = require('../config/storage');

const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(storageDir, { recursive: true, mode: 0o700 }, (error) => callback(error, storageDir));
  },
  filename(req, file, callback) {
    callback(null, randomUUID());
  },
});

module.exports = multer({
  storage,
  defParamCharset: 'latin1',
  limits: { fileSize: maxUploadSize, fields: 16, parts: 18, fieldSize: 16384, fieldNestingDepth: 4 },
}).single('file');