import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { downloadDocument, listDocuments, uploadDocument } from '../src/services/documentService.js';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('lista documentos usando o proxy e o usuário informado', async () => {
  const controller = new AbortController();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/documents');
    assert.equal(options.headers['X-User-Id'], 'alice');
    assert.equal(options.signal, controller.signal);
    return Response.json([{ id: '123' }]);
  };
  assert.deepEqual(await listDocuments('alice', controller.signal), [{ id: '123' }]);
});

test('envia arquivo multipart e baixa o documento', async () => {
  const file = new File(['conteúdo'], 'teste.txt', { type: 'text/plain' });
  globalThis.fetch = async (url, options) => {
    assert.equal(options.headers['X-User-Id'], 'alice');
    if (options.method === 'POST') {
      assert.equal(url, '/api/upload');
      assert.equal(options.body.get('file'), file);
      return Response.json({ id: '123' }, { status: 201 });
    }
    assert.equal(url, '/api/documents/id%2F123/download');
    return new Response('conteúdo');
  };
  assert.deepEqual(await uploadDocument('alice', file), { id: '123' });
  assert.equal(await (await downloadDocument('alice', 'id/123')).text(), 'conteúdo');
});

test('apresenta erros da API e de conexão', async () => {
  globalThis.fetch = async () => Response.json({ error: 'Arquivo inválido.' }, { status: 400 });
  await assert.rejects(uploadDocument('alice', new File([''], 'teste.txt')), { message: 'Arquivo inválido.' });
  globalThis.fetch = async () => { throw new TypeError('network error'); };
  await assert.rejects(listDocuments('alice'), { message: 'Não foi possível conectar ao servidor.' });
});