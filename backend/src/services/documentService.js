const { randomUUID } = require('node:crypto');

function createDocumentService(repository) {
  return {
    createDocument(file, owner) {
      return repository.save({
        id: randomUUID(),
        originalName: file.originalname,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        owner,
        filePath: file.path,
      });
    },
    listDocuments() {
      return repository.findAll();
    },
    getDocument(id) {
      return repository.findById(id);
    },
  };
}

module.exports = createDocumentService;
