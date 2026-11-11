const { randomUUID } = require('node:crypto');
const repository = require('../repositories/document.repository');

function decodeFileName(name) {
  if ([...name].some((character) => character.codePointAt(0) > 255)) return name;
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(Buffer.from(name, 'latin1'));
  } catch {
    return name;
  }
}

function publicDocument(document) {
  const { storedName, ...metadata } = document;
  return metadata;
}

module.exports = {
  create(file, owner) {
    const document = {
      id: randomUUID(),
      originalName: decodeFileName(file.originalname),
      storedName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner,
    };
    repository.save(document);
    return publicDocument(document);
  },
  list(owner, offset = 0, limit) {
    return repository.findByOwner(owner)
      .reverse()
      .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt))
      .slice(offset, limit === undefined ? undefined : offset + limit)
      .map(publicDocument);
  },
  findForDownload(id, owner) {
    const document = repository.findById(id);
    if (!document || document.owner !== owner) return null;
    return { document, filePath: repository.filePath(document) };
  },
};