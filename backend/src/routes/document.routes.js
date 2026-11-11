const express = require('express');
const { rateLimit } = require('express-rate-limit');
const controller = require('../controllers/document.controller');

const router = express.Router();
const uploadRateLimit = Number(process.env.UPLOAD_RATE_LIMIT || 100);
if (!Number.isSafeInteger(uploadRateLimit) || uploadRateLimit <= 0) {
	throw new Error('UPLOAD_RATE_LIMIT deve ser um inteiro positivo.');
}
const limitUploads = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: uploadRateLimit,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	message: { error: 'Muitas tentativas de envio. Tente novamente mais tarde.' },
});

router.use((req, res, next) => {
	res.set('Cache-Control', 'private, no-store');
	next();
});

router.post('/upload', limitUploads, controller.identifyUser, controller.upload);
router.get('/documents', controller.identifyUser, controller.list);
router.get('/documents/:id/download', controller.identifyUser, controller.download);

module.exports = router;