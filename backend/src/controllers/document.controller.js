const multer = require('multer');
const service = require('../services/document.service');

function identifyUser(req, res, next) {
  const owner = req.get('X-User-Id')?.trim();
  if (!owner) return res.status(400).json({ error: 'Informe o cabeçalho X-User-Id.' });
  req.owner = owner;
  next();
}

function upload(req, res) {
  service.upload(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'O arquivo excede o tamanho máximo permitido.' });
      }
      return res.status(400).json({ error: 'Arquivo enviado inválido.' });
    }
    if (error && /^(Multipart: Boundary not found|Unexpected end of form|Malformed part header)$/.test(error.message)) {
      return res.status(400).json({ error: 'Requisição multipart inválida.' });
    }
    if (error) return res.status(500).json({ error: 'Não foi possível salvar o arquivo.' });
    if (!req.file) return res.status(400).json({ error: 'Informe um arquivo no campo file.' });
    return res.status(201).json(service.create(req.file, req.owner));
  });
}

function list(req, res) {
  res.json(service.list(req.owner));
}

function download(req, res) {
  const result = service.findForDownload(req.params.id, req.owner);
  if (!result) return res.status(404).json({ error: 'Documento não encontrado.' });
  res.setHeader('Content-Type', result.document.mimeType);
  res.download(result.filePath, result.document.originalName, (error) => {
    if (!error) return;
    if (res.headersSent) return res.destroy(error);
    res.status(error.code === 'ENOENT' ? 404 : 500).json({ error: 'Não foi possível baixar o documento.' });
  });
}

module.exports = { identifyUser, upload, list, download };