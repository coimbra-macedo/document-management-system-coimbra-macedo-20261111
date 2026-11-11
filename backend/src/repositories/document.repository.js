const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');

const storageDir = path.resolve(process.env.STORAGE_DIR || path.join(__dirname, '../../storage'));
const maxUploadSize = Number(process.env.MAX_UPLOAD_SIZE_BYTES || 10 * 1024 * 1024);
if (!Number.isSafeInteger(maxUploadSize) || maxUploadSize <= 0) {
  throw new Error('MAX_UPLOAD_SIZE_BYTES deve ser um inteiro positivo.');
}

const documents = new Map();
const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(storageDir, { recursive: true }, (error) => callback(error, storageDir));
  },
  filename(req, file, callback) {
    callback(null, randomUUID());
  },
});

module.exports = {
  upload: multer({ storage, limits: { fileSize: maxUploadSize } }).single('file'),
  save(document) {
    documents.set(document.id, document);
  },
  findAll() {
    return Array.from(documents.values());
  },
  findById(id) {
    return documents.get(id);
  },
  filePath(document) {
    return path.join(storageDir, document.storedName);
  },
};