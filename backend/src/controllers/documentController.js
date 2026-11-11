function createDocumentController(service) {
  return {
    uploadDocument(req, res) {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
      }

      const document = service.createDocument(
        req.file,
        req.body.owner || 'anonymous',
      );
      const { filePath, ...metadata } = document;

      return res.status(201).json(metadata);
    },
    listDocuments(req, res) {
      return res.json(service.listDocuments());
    },
    downloadDocument(req, res, next) {
      const document = service.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: 'Documento não encontrado.' });
      }

      return res.download(document.filePath, document.originalName, (error) => {
        if (!error) return;
        if (res.headersSent) return next(error);

        const statusCode = error.code === 'ENOENT' ? 404 : 500;
        return res.status(statusCode).json({
          error: statusCode === 404
            ? 'Documento não encontrado.'
            : 'Não foi possível baixar o documento.',
        });
      });
    },
  };
}

module.exports = createDocumentController;
