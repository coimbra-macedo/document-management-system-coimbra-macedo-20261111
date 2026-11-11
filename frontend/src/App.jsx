import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Files, FolderOpen, ShieldCheck } from 'lucide-react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import { listDocuments } from './services/documentService.js';
import './styles.css';

export default function App() {
  const [userInput, setUserInput] = useState('');
  const [owner, setOwner] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const currentOwner = useRef('');

  useEffect(() => {
    if (!owner) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    listDocuments(owner, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted && currentOwner.current === owner) setDocuments(result);
      })
      .catch((requestError) => {
        if (!controller.signal.aborted && currentOwner.current === owner) setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [owner, refresh]);

  function selectOwner(event) {
    event.preventDefault();
    const nextOwner = userInput.trim();
    if (!nextOwner) return;
    if (nextOwner !== currentOwner.current) {
      currentOwner.current = nextOwner;
      setDocuments([]);
      setOwner(nextOwner);
    } else {
      setRefresh((value) => value + 1);
    }
  }

  function handleUploaded(uploadOwner) {
    if (currentOwner.current === uploadOwner) setRefresh((value) => value + 1);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><Files size={21} /></span><span>arquivo<span className="brand-dot">.</span></span></div>
        <div className="sidebar-label">ESPAÇO DE TRABALHO</div>
        <div className="sidebar-active"><FolderOpen size={18} /><span>Documentos</span><span className="active-indicator" /></div>
        <div className="sidebar-bottom"><ShieldCheck size={17} /><span>Organização local</span></div>
      </aside>
      <main className="workspace">
        <header className="topbar"><span>ESPAÇO DE TRABALHO <span className="breadcrumb-separator">/</span> <strong>DOCUMENTOS</strong></span><span className="topbar-status"><span /> Sistema local</span></header>
        <div className="content">
          <div className="page-heading"><div><div className="eyebrow"><span /> SEU ARQUIVO DIGITAL</div><h1>Documentos<span>.</span></h1><p>Seus arquivos, organizados em um só lugar.</p></div><div className="heading-icon"><FolderOpen size={27} strokeWidth={1.5} /></div></div>
          <section className="identity-section" aria-labelledby="identity-title">
            <div className="section-copy"><span className="section-number">01</span><div><h2 id="identity-title">Identificação</h2><p>Selecione o usuário para acessar os documentos.</p></div></div>
            <form className="identity-form" onSubmit={selectOwner}>
              <label htmlFor="user-id">Identificador do usuário</label>
              <div className="identity-controls"><input id="user-id" value={userInput} onChange={(event) => setUserInput(event.target.value)} placeholder="Ex.: maria.silva" required /><button className="button button-dark" type="submit">Acessar <ArrowRight size={17} /></button></div>
              {owner && <div className="current-user">Acessando como <strong>{owner}</strong></div>}
            </form>
          </section>
          <section className="upload-section" aria-labelledby="upload-title">
            <div className="section-copy"><span className="section-number">02</span><div><h2 id="upload-title">Adicionar documento</h2><p>Envie um arquivo para o seu espaço.</p></div></div>
            <UploadComponent key={owner} owner={owner} onUploaded={handleUploaded} />
          </section>
          <section className="documents-section" aria-labelledby="documents-title">
            <div className="list-heading"><div><div className="eyebrow"><span /> BIBLIOTECA</div><h2 id="documents-title">Seus documentos</h2></div><span className="document-count">{documents.length} {documents.length === 1 ? 'ARQUIVO' : 'ARQUIVOS'}</span></div>
            <DocumentList owner={owner} documents={documents} loading={loading} error={error} onRetry={() => setRefresh((value) => value + 1)} />
          </section>
          <footer className="footer"><span>ARQUIVO DIGITAL</span><span>Seus documentos, ao seu alcance.</span></footer>
        </div>
      </main>
    </div>
  );
}
