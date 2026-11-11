import { FileText, FolderOpen, RefreshCw } from 'lucide-react';
import DownloadButton from './DownloadButton.jsx';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`;
}

export default function DocumentList({ owner, documents, loading, error, onRetry }) {
  if (!owner) return <div className="empty-state"><FolderOpen size={25} /><strong>Seu espaço está esperando por você</strong><span>Identifique-se para visualizar seus documentos.</span></div>;
  if (loading) return <div className="empty-state" role="status">Carregando documentos...</div>;
  if (error) return <div className="empty-state" role="alert"><strong>Não foi possível carregar os documentos.</strong><span>{error}</span><button className="retry-button" onClick={onRetry}><RefreshCw size={15} /> Tentar novamente</button></div>;
  if (!documents.length) return <div className="empty-state"><FolderOpen size={25} /><strong>Nenhum documento por aqui</strong><span>Os arquivos enviados aparecerão nesta lista.</span></div>;

  return (
    <div className="table-scroll"><table><thead><tr><th>DOCUMENTO</th><th>DATA DE ENVIO</th><th>TAMANHO</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>
      {documents.map((document) => <tr key={document.id}><td><div className="document-name"><span className="file-icon"><FileText size={19} /></span><span><strong>{document.originalName}</strong><small>{document.mimeType}</small></span></div></td><td>{new Date(document.uploadedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</td><td>{formatSize(document.size)}</td><td className="action-cell"><DownloadButton owner={owner} document={document} /></td></tr>)}
    </tbody></table></div>
  );
}