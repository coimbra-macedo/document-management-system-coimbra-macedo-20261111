const { randomUUID } = require('node:crypto');
const repository = require('../repositories/document.repository');

function publicDocument(document) {
  const { storedName, ...metadata } = document;
  return metadata;
}

module.exports = {
  upload: repository.upload,
  create(file, owner) {
    const document = {
      id: randomUUID(),
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner,
    };
    repository.save(document);
    return publicDocument(document);
  },
  list(owner) {
    return repository.findAll()
      .filter((document) => document.owner === owner)
      .reverse()
      .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt))
      .map(publicDocument);
  },
  findForDownload(id, owner) {
    const document = repository.findById(id);
    if (!document || document.owner !== owner) return null;
    return { document, filePath: repository.filePath(document) };
  },
};