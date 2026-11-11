const { after, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const storageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
const app = require('../src/app').createApp({ storageDirectory });
const server = app.listen(0);

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  fs.rmSync(storageDirectory, { recursive: true, force: true });
});

test('upload, listing, and download endpoints handle a document', async () => {
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const formData = new FormData();
  formData.append('file', new Blob(['document contents']), 'report.txt');
  formData.append('owner', 'user-123');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });
  assert.equal(uploadResponse.status, 201);

  const document = await uploadResponse.json();
  assert.equal(document.originalName, 'report.txt');
  assert.equal(document.size, Buffer.byteLength('document contents'));
  assert.equal(document.owner, 'user-123');
  assert.ok(Number.isFinite(Date.parse(document.uploadedAt)));
  assert.ok(document.id);
  assert.equal(Object.hasOwn(document, 'filePath'), false);

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.equal(listResponse.status, 200);
  assert.deepEqual(await listResponse.json(), [document]);

  const downloadResponse = await fetch(
    `${baseUrl}/documents/${document.id}/download`,
  );
  assert.equal(downloadResponse.status, 200);
  assert.equal(await downloadResponse.text(), 'document contents');

  const missingResponse = await fetch(
    `${baseUrl}/documents/unknown/download`,
  );
  assert.equal(missingResponse.status, 404);
});
