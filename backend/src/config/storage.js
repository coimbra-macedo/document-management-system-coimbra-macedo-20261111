const path = require('node:path');

const storageDir = path.resolve(process.env.STORAGE_DIR || path.join(__dirname, '../../storage'));
const maxUploadSize = Number(process.env.MAX_UPLOAD_SIZE_BYTES || 10 * 1024 * 1024);
if (!Number.isSafeInteger(maxUploadSize) || maxUploadSize <= 0) {
  throw new Error('MAX_UPLOAD_SIZE_BYTES deve ser um inteiro positivo.');
}

module.exports = { storageDir, maxUploadSize };