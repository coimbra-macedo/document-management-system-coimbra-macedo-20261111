const express = require('express');
const controller = require('../controllers/document.controller');

const router = express.Router();

router.post('/upload', controller.identifyUser, controller.upload);
router.get('/documents', controller.identifyUser, controller.list);
router.get('/documents/:id/download', controller.identifyUser, controller.download);

module.exports = router;