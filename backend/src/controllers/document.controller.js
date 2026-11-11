const multer = require('multer');
const service = require('../services/document.service');
const uploadFile = require('../middleware/upload');

function identifyUser(req, res, next) {
  let owner = req.get('X-User-Id');
  const encoding = req.get('X-User-Id-Encoding');
  if (encoding) {
    if (encoding !== 'percent-utf8') return res.status(400).json({ error: 'Codificação de usuário inválida.' });
    try {
      owner = decodeURIComponent(owner || '');
    } catch {
      return res.status(400).json({ error: 'Identificador de usuário inválido.' });
    }
  }
  owner = owner?.trim();
  if (!owner) return res.status(400).json({ error: 'Informe o cabeçalho X-User-Id.' });
  req.owner = owner;
  next();
}

function upload(req, res) {
  uploadFile(req, res, (error) => {
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
  const { offset, limit } = req.query;
  const validNumber = (value) => typeof value === 'string' && /^\d+$/.test(value) && Number.isSafeInteger(Number(value));
  if ((offset !== undefined && !validNumber(offset)) ||
      (limit !== undefined && (!validNumber(limit) || Number(limit) < 1 || Number(limit) > 1000))) {
    return res.status(400).json({ error: 'Parâmetros de paginação inválidos.' });
  }
  return res.json(service.list(req.owner, offset === undefined ? 0 : Number(offset), limit === undefined ? undefined : Number(limit)));
}

function download(req, res) {
  const result = service.findForDownload(req.params.id, req.owner);
  if (!result) return res.status(404).json({ error: 'Documento não encontrado.' });
  res.setHeader('Content-Type', result.document.mimeType);
  res.download(result.filePath, result.document.originalName, (error) => {
    if (!error) return;
    if (res.headersSent) return res.destroy(error);
    res.removeHeader('Content-Type');
    res.removeHeader('Content-Disposition');
    res.status(error.code === 'ENOENT' ? 404 : 500).json({ error: 'Não foi possível baixar o documento.' });
  });
}

module.exports = { identifyUser, upload, list, download };