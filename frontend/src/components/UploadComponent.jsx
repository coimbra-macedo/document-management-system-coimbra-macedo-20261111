import { useRef, useState } from 'react';
import { FilePlus2, Upload } from 'lucide-react';
import { uploadDocument } from '../services/documentService.js';

export default function UploadComponent({ owner, onUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!owner || !file || uploading) return;
    setUploading(true);
    setError('');
    setMessage('');
    try {
      await uploadDocument(owner, file);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      setMessage('Documento enviado com sucesso.');
      onUploaded(owner);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <div className="upload-controls">
        <label className={`file-picker${!owner || uploading ? ' disabled' : ''}`}>
          <FilePlus2 size={20} />
          <span className="file-picker-text"><strong>{file ? file.name : 'Selecionar arquivo'}</strong><small>{file ? 'Arquivo pronto para envio' : 'Escolha um arquivo do seu dispositivo'}</small></span>
          <span className="browse-text">Procurar</span>
          <input ref={inputRef} type="file" disabled={!owner || uploading} onChange={(event) => { setFile(event.target.files[0] || null); setMessage(''); setError(''); }} />
        </label>
        <button className="button button-accent" type="submit" disabled={!owner || !file || uploading}><Upload size={17} /> {uploading ? 'Enviando...' : 'Enviar arquivo'}</button>
      </div>
      {!owner && <p className="field-note">Informe um usuário para habilitar o envio.</p>}
      {message && <p className="success-message" role="status">{message}</p>}
      {error && <p className="error-message" role="alert">{error}</p>}
    </form>
  );
}