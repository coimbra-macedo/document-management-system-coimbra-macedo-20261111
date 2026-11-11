function createDocumentRepository() {
  const documents = new Map();

  return {
    save(document) {
      documents.set(document.id, document);
      return document;
    },
    findAll() {
      return [...documents.values()].map(({ filePath, ...document }) => document);
    },
    findById(id) {
      return documents.get(id) || null;
    },
  };
}

module.exports = createDocumentRepository;
