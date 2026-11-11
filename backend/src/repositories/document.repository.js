const path = require('node:path');
const { storageDir } = require('../config/storage');

const documents = new Map();
const documentsByOwner = new Map();

module.exports = {
  save(document) {
    documents.set(document.id, document);
    if (!documentsByOwner.has(document.owner)) documentsByOwner.set(document.owner, []);
    documentsByOwner.get(document.owner).push(document);
  },
  findByOwner(owner) {
    return [...(documentsByOwner.get(owner) || [])];
  },
  findById(id) {
    return documents.get(id);
  },
  filePath(document) {
    return path.join(storageDir, document.storedName);
  },
};