const express = require('express');
const documentRoutes = require('./routes/document.routes');

const app = express();
const PORT = process.env.PORT || 3000;

if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY);

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(documentRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido.' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'O conteúdo da requisição excede o tamanho permitido.' });
  }
  return res.status(500).json({ error: 'Erro interno do servidor.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
