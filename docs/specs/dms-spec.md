# Especificação - Document Management System

## 1. Objetivo

Entregar um sistema web que permita enviar, listar e baixar documentos, com armazenamento local na aplicação e gestão simples por usuário.

## 2. Escopo

### Dentro do escopo

- Upload de documentos (multipart/form-data, via `multer` com `diskStorage`)
- Listagem dos documentos do usuário
- Download de documentos pelo identificador
- Gestão simples por usuário (cada documento tem um dono)
- Interface React para envio, listagem e download
- Endpoint `GET /health` já existente no seed

### Fora do escopo

- Armazenamento externo ou em nuvem (S3, GCS, Azure etc.)
- Serviços de upload de terceiros
- Versionamento de documentos
- Autenticação completa (login, senha, tokens, sessões)
- Persistência em banco de dados (metadados ficam em memória nesta fase)
- Exclusão, edição ou compartilhamento de documentos

## 3. Requisitos funcionais

| ID    | Requisito                                                                             |
| ----- | ------------------------------------------------------------------------------------- |
| RF-01 | O usuário pode enviar um documento informando o arquivo no campo `file`               |
| RF-02 | O sistema registra os metadados do documento (id, nome original, tamanho, data, dono) |
| RF-03 | O usuário pode listar apenas os documentos de sua propriedade                         |
| RF-04 | O usuário pode baixar um documento pelo identificador, somente se for o dono          |
| RF-05 | O sistema rejeita envios sem arquivo ou acima do tamanho máximo configurado           |
| RF-06 | O sistema responde 404 quando o documento não existe ou não pertence ao usuário       |
| RF-07 | O frontend exibe formulário de upload, lista de documentos e ação de download         |

## 4. Requisitos não funcionais

| ID     | Requisito                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------- |
| RNF-01 | Arquivos gravados no filesystem local da aplicação (`backend/storage`) via `multer` `diskStorage` |
| RNF-02 | Metadados mantidos em memória nesta fase (perdidos ao reiniciar o servidor)                       |
| RNF-03 | Configuração via variáveis de ambiente (12-Factor): `PORT`, `STORAGE_DIR`, `MAX_UPLOAD_SIZE_BYTES` |
| RNF-04 | Backend em CommonJS; frontend em React + Vite (ESM); sem TypeScript                               |
| RNF-05 | Testes do backend com `node:test`                                                                 |
| RNF-06 | Erros tratados nos limites do sistema (entrada HTTP, leitura/escrita de arquivos)                 |
| RNF-07 | Nomes de símbolos em inglês; mensagens ao usuário e comentários em português                      |

## 5. Modelo de dados (metadados do documento)

| Campo        | Tipo   | Descrição                                                      |
| ------------ | ------ | -------------------------------------------------------------- |
| id           | string | Identificador único (UUID v4)                                  |
| originalName | string | Nome original do arquivo enviado                               |
| storedName   | string | Nome do arquivo gravado em `STORAGE_DIR` (uso interno)         |
| mimeType     | string | Tipo MIME informado pelo cliente                               |
| size         | number | Tamanho em bytes                                               |
| uploadedAt   | string | Data/hora do upload (ISO 8601)                                 |
| owner        | string | Identificador do usuário dono (valor do cabeçalho `X-User-Id`) |

`storedName` não é exposto nas respostas da API.

## 6. Contratos de API

Todas as respostas de erro seguem o formato `{ "error": "mensagem em português" }`.
Identificação do usuário: cabeçalho `X-User-Id` obrigatório em todas as rotas de documentos. Ausência ou valor vazio retorna `400`.

### GET /health

- Saída `200`: `{ "status": "ok" }`

### POST /upload

- Entrada: `multipart/form-data`, campo `file` (obrigatório)
- Saída `201`: metadados do documento criado (sem `storedName`)
- Erros: `400` (arquivo ausente ou `X-User-Id` ausente), `413` (arquivo acima de `MAX_UPLOAD_SIZE_BYTES`)

### GET /documents

- Saída `200`: array com metadados dos documentos do usuário (`X-User-Id`), ordenados por `uploadedAt` decrescente
- Erros: `400` (`X-User-Id` ausente)

### GET /documents/:id/download

- Saída `200`: conteúdo binário do arquivo, com `Content-Type` = `mimeType` e `Content-Disposition: attachment; filename="<originalName>"`
- Erros: `400` (`X-User-Id` ausente), `404` (documento inexistente ou de outro usuário)

## 7. Decisões arquiteturais

- Backend em Clean Architecture simples dentro de `backend/src`, com fluxo `routes -> controllers -> services -> repositories`. Camadas internas não importam camadas externas.
  - `routes/`: define endpoints e delega aos controllers
  - `controllers/`: trata entrada/saída HTTP e validação básica
  - `services/`: regras de negócio (ownership, limites, geração de id)
  - `repositories/`: persistência de arquivos (`multer` / `fs`) e de metadados (Map em memória)
- `app.js` continua exportando o `app` Express, para permitir testes sem subir o servidor.
- Frontend em componentes React funcionais com Hooks: `components/`, `pages/`, `services/`. Comunicação via `fetch` com prefixo `/api` (proxy do Vite).
- Armazenamento estritamente local.
- Sem overengineering: sem ORM, sem filas, sem camada de autenticação dedicada nesta fase.

## 8. Plano de execução

Etapas em ordem. Etapas marcadas com "paralelo" podem ser feitas ao mesmo tempo.

1. **Configuração e ambiente**: definir leitura de `PORT`, `STORAGE_DIR` (padrão `backend/storage`) e `MAX_UPLOAD_SIZE_BYTES` (padrão 10 MB); garantir criação da pasta de armazenamento.
2. **Repositórios**: `documentRepository` (Map em memória com CRUD de metadados) e `fileRepository` (gravação/leitura via `multer` `diskStorage`). *Paralelo com a etapa 3.*
3. **Serviços**: `documentService` com regras de upload, listagem filtrada por dono e download com verificação de ownership. *Depende da etapa 2.*
4. **Controllers e middleware de identificação**: validação de `X-User-Id`, tradução de erros do multer (tamanho, campo ausente) para `400`/`413`, formatação das respostas. *Depende da etapa 3.*
5. **Rotas**: `POST /upload`, `GET /documents`, `GET /documents/:id/download` ligadas aos controllers em `routes/`. *Depende da etapa 4.*
6. **Testes do backend**: `node:test` cobrindo upload válido, upload sem arquivo, upload acima do limite, listagem por dono, download próprio, download de outro usuário (404) e `X-User-Id` ausente. *Depende da etapa 5.*
7. **Frontend - serviço e componentes**: `services/documentService.js` (chamadas `fetch` para `/api`), componentes de upload e lista reutilizáveis. *Paralelo com a etapa 6, após a etapa 5.*
8. **Frontend - página e integração**: página principal em `pages/`, campo para informar o `X-User-Id`, ação de download, mensagens de erro em português. *Depende da etapa 7.*
9. **Verificação ponta a ponta**: subir backend e frontend, executar fluxo upload -> listagem -> download, confirmar que o arquivo gravado em `backend/storage` é idêntico ao original.
10. **Documentação**: atualizar `README.md` com variáveis de ambiente e comandos de execução.

## 9. Critérios de aceitação

- Todos os requisitos funcionais RF-01 a RF-07 atendidos.
- Testes da etapa 6 passando com `node --test`.
- Nenhum provedor externo de armazenamento utilizado.
- `GET /health` continua respondendo `200`.

## 10. Questões em aberto

1. **Identificação do usuário**: o cabeçalho `X-User-Id` é suficiente para esta fase, ou deve haver um mecanismo simples de login? Recomendação: cabeçalho `X-User-Id`, pois autenticação está fora do escopo.
2. **Limite de tamanho**: 10 MB é adequado como padrão? Recomendação: sim, configurável via `MAX_UPLOAD_SIZE_BYTES`.
3. **Tipos de arquivo aceitos**: qualquer tipo ou lista restrita (ex.: PDF, PNG, JPG, DOCX)? Recomendação: qualquer tipo nesta fase.
