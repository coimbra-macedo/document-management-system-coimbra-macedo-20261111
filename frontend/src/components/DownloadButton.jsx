import { useState } from 'react';
import { Download } from 'lucide-react';
import { downloadDocument } from '../services/documentService.js';

export default function DownloadButton({ owner, document }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    setLoading(true);
    setError('');
    try {
      const blob = await downloadDocument(owner, document.id);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalName;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return <div className="download-action"><button className="icon-button" type="button" title={`Baixar ${document.originalName}`} aria-label={`Baixar ${document.originalName}`} disabled={loading} onClick={handleDownload}><Download size={18} /></button>{error && <span className="download-error" role="alert">{error}</span>}</div>;
}