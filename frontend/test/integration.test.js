import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { downloadDocument, listDocuments, uploadDocument } from '../src/services/documentService.js';

const frontendDir = fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(import.meta.url);
const backendRequire = createRequire(new URL('../../backend/src/app.js', import.meta.url));
let backendAvailable = true;
try {
  for (const dependency of ['express', 'multer', 'express-rate-limit']) backendRequire.resolve(dependency);
} catch {
  backendAvailable = false;
}

test('cliente usa o proxy real para enviar, listar e baixar arquivos', { skip: backendAvailable ? false : 'Instale as dependências do backend.' }, async (context) => {
  const storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-integration-'));
  process.env.STORAGE_DIR = storageDir;
  const app = require('../../backend/src/app.js');
  const backend = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => backend.once('listening', resolve));
  context.after(async () => {
    await new Promise((resolve, reject) => backend.close((error) => error ? reject(error) : resolve()));
    await fs.rm(storageDir, { recursive: true, force: true });
  });
  const vite = await createServer({
    root: frontendDir,
    server: {
      host: '127.0.0.1',
      port: 0,
      proxy: { '/api': { target: `http://127.0.0.1:${backend.address().port}` } },
    },
  });
  await vite.listen();
  context.after(() => vite.close());
  const nativeFetch = globalThis.fetch;
  globalThis.fetch = (url, options) => nativeFetch(`http://127.0.0.1:${vite.httpServer.address().port}${url}`, options);
  context.after(() => { globalThis.fetch = nativeFetch; });

  const owner = 'usuário 漢字';
  const file = new File(['conteúdo do arquivo'], 'ação.txt', { type: 'text/plain' });
  const document = await uploadDocument(owner, file);
  assert.equal(document.originalName, 'ação.txt');
  assert.deepEqual(await listDocuments(owner), [document]);
  assert.deepEqual(await listDocuments('outro'), []);
  assert.equal(await (await downloadDocument(owner, document.id)).text(), 'conteúdo do arquivo');
  await assert.rejects(downloadDocument('outro', document.id), { message: 'Documento não encontrado.' });
  const filenames = await fs.readdir(storageDir);
  assert.equal(filenames.length, 1);
  assert.equal(await fs.readFile(path.join(storageDir, filenames[0]), 'utf8'), 'conteúdo do arquivo');
});