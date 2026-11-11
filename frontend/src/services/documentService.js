async function request(path, owner, options = {}) {
  let response;
  const headers = { ...options.headers, 'X-User-Id': owner };
  if (/[^\u0000-\u00ff]/.test(owner)) {
    headers['X-User-Id'] = encodeURIComponent(owner);
    headers['X-User-Id-Encoding'] = 'percent-utf8';
  }
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Não foi possível conectar ao servidor.');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || 'Não foi possível concluir a operação.');
  }
  return response;
}

export async function listDocuments(owner, signal) {
  const response = await request('/documents', owner, { signal });
  return response.json();
}

export async function uploadDocument(owner, file) {
  const body = new FormData();
  body.append('file', file);
  const response = await request('/upload', owner, { method: 'POST', body });
  return response.json();
}

export async function downloadDocument(owner, id) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`, owner);
  return response.blob();
}