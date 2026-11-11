const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const storageDir = path.join(os.tmpdir(), `dms-test-${process.pid}`);
process.env.STORAGE_DIR = storageDir;
process.env.MAX_UPLOAD_SIZE_BYTES = '5';
const app = require('../src/app');

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('fluxo de documentos respeita o contrato da API', async (context) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  context.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await fs.rm(storageDir, { recursive: true, force: true });
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const request = (url, options = {}) => fetch(`${baseUrl}${url}`, options);
  const upload = (owner, contents, field = 'file') => {
    const form = new FormData();
    if (contents !== null) form.append(field, new Blob([contents], { type: 'text/plain' }), 'teste.txt');
    return request('/upload', { method: 'POST', headers: { 'X-User-Id': owner }, body: form });
  };

  assert.deepStrictEqual(await (await request('/health')).json(), { status: 'ok' });
  for (const [url, options] of [['/upload', { method: 'POST' }], ['/documents', {}], ['/documents/123/download', {}]]) {
    const response = await request(url, options);
    assert.strictEqual(response.status, 400);
    assert.ok((await response.json()).error);
  }
  const invalidJson = await request('/upload', {
    method: 'POST',
    headers: { 'X-User-Id': 'alice', 'Content-Type': 'application/json' },
    body: '{',
  });
  assert.strictEqual(invalidJson.status, 400);
  assert.ok((await invalidJson.json()).error);
  assert.strictEqual((await upload('alice', null)).status, 400);
  assert.strictEqual((await upload('alice', '123456')).status, 413);
  assert.strictEqual((await upload('alice', 'abc', 'outro')).status, 400);
  const malformed = await request('/upload', {
    method: 'POST',
    headers: { 'X-User-Id': 'alice', 'Content-Type': 'multipart/form-data' },
    body: 'inválido',
  });
  assert.strictEqual(malformed.status, 400);
  assert.ok((await malformed.json()).error);

  const response = await upload('alice', 'abc');
  assert.strictEqual(response.status, 201);
  const document = await response.json();
  assert.match(document.id, /^[0-9a-f-]{36}$/);
  assert.strictEqual(document.originalName, 'teste.txt');
  assert.strictEqual(document.mimeType, 'text/plain');
  assert.strictEqual(document.size, 3);
  assert.strictEqual(document.owner, 'alice');
  assert.ok(!Number.isNaN(Date.parse(document.uploadedAt)));
  assert.ok(!('storedName' in document));
  assert.deepStrictEqual(await fs.readFile(path.join(storageDir, (await fs.readdir(storageDir))[0]), 'utf8'), 'abc');

  const aliceHeaders = { 'X-User-Id': 'alice' };
  const bobHeaders = { 'X-User-Id': 'bob' };
  assert.deepStrictEqual(await (await request('/documents', { headers: aliceHeaders })).json(), [document]);
  assert.deepStrictEqual(await (await request('/documents', { headers: bobHeaders })).json(), []);
  const download = await request(`/documents/${document.id}/download`, { headers: aliceHeaders });
  assert.strictEqual(download.status, 200);
  assert.strictEqual(download.headers.get('content-type'), 'text/plain');
  assert.match(download.headers.get('content-disposition'), /attachment;.*teste\.txt/);
  assert.strictEqual(await download.text(), 'abc');
  assert.strictEqual((await request(`/documents/${document.id}/download`, { headers: bobHeaders })).status, 404);
  assert.strictEqual((await request('/documents/inexistente/download', { headers: aliceHeaders })).status, 404);
  const secondDocument = await (await upload('alice', 'xyz')).json();
  assert.deepStrictEqual(await (await request('/documents', { headers: aliceHeaders })).json(), [secondDocument, document]);
  for (const filename of await fs.readdir(storageDir)) {
    await fs.unlink(path.join(storageDir, filename));
  }
  const missingFile = await request(`/documents/${document.id}/download`, { headers: aliceHeaders });
  assert.strictEqual(missingFile.status, 404);
  assert.ok((await missingFile.json()).error);
});
