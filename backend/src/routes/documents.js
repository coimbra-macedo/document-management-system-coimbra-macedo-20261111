const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const express = require('express');
const { rateLimit } = require('express-rate-limit');
const multer = require('multer');
const createDocumentController = require('../controllers/documentController');

function createDocumentRouter(service, storageDirectory) {
  fs.mkdirSync(storageDirectory, { recursive: true });

  const upload = multer({
    storage: multer.diskStorage({
      destination: storageDirectory,
      filename(req, file, callback) {
        callback(null, randomUUID());
      },
    }),
  });
  const controller = createDocumentController(service);
  const router = express.Router();

  router.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }));
  router.post('/upload', upload.single('file'), controller.uploadDocument);
  router.get('/documents', controller.listDocuments);
  router.get('/documents/:id/download', controller.downloadDocument);

  return router;
}

module.exports = createDocumentRouter;
