# Document Management System com GitHub Copilot

<img src="https://octodex.github.com/images/Professortocat_v2.png" align="right" height="200px" />

Hey coimbra-macedo!

Mona here. I'm done preparing your exercise. Hope you enjoy! 💚

Remember, it's self-paced so feel free to take a break! ☕️

[![](https://img.shields.io/badge/Go%20to%20Exercise-%E2%86%92-1f883d?style=for-the-badge&logo=github&labelColor=197935)](https://github.com/coimbra-macedo/document-management-system-coimbra-macedo-20261111/issues/1)

---

## Backend DMS

Execute `npm install` e `npm start` no diretório `backend`. Os testes são executados com `npm test` no mesmo diretório.

Configuração por variáveis de ambiente:

- `PORT`: porta HTTP (padrão: `3000`).
- `STORAGE_DIR`: diretório local dos arquivos (padrão: `backend/storage`).
- `MAX_UPLOAD_SIZE_BYTES`: limite por arquivo em bytes (padrão: `10485760`, ou 10 MB).
- `UPLOAD_RATE_LIMIT`: número máximo de tentativas de upload por IP a cada 15 minutos (padrão: `100`). O limite é local ao processo e não substitui proteção no proxy reverso.
- `TRUST_PROXY`: endereços de proxies confiáveis no formato aceito pelo Express, por exemplo `loopback`; deixe indefinida sem proxy. Informe apenas proxies controlados pela implantação para evitar falsificação do IP.

As rotas `POST /upload`, `GET /documents` e `GET /documents/:id/download` exigem o cabeçalho `X-User-Id`. O upload usa `multipart/form-data` com o campo `file`. Os metadados permanecem em memória e são perdidos ao reiniciar o servidor. O cabeçalho identifica o usuário, mas não fornece autenticação.

A listagem aceita os parâmetros opcionais `limit` (de 1 a 1000) e `offset` (inteiro não negativo), por exemplo `GET /documents?limit=50&offset=0`. Sem parâmetros, continua retornando todos os documentos do usuário.

Para identificadores que não possam ser enviados diretamente em cabeçalhos HTTP, clientes podem enviar `X-User-Id` codificado com `encodeURIComponent` e incluir `X-User-Id-Encoding: percent-utf8`. O formato original continua aceito. O upload permite até 16 campos adicionais, com até 16 KB por campo.

Novos diretórios de armazenamento são criados com acesso restrito ao usuário do processo. Diretórios existentes não têm suas permissões alteradas; verifique e restrinja o acesso antes de usar documentos sensíveis. Configure uma cota de disco e limites de tráfego na infraestrutura. Após um reinício, arquivos existentes permanecem no disco, mas não aparecem na listagem; defina uma política operacional para arquivos órfãos. Múltiplas instâncias não compartilham metadados.

## Frontend DMS

Execute `npm install` e `npm run dev` no diretório `frontend`; para verificar, use `npm test` e `npm run build`. Em desenvolvimento, o Vite encaminha `/api` para `http://localhost:3000`. Para publicação, sirva o conteúdo gerado em `frontend/dist` e configure o servidor ou proxy reverso para encaminhar `/api/*` ao backend, removendo o prefixo `/api`. O proxy de desenvolvimento não é aplicado ao build de produção.

Não exponha esta implementação a usuários não confiáveis: o cabeçalho de identificação pode ser falsificado e não substitui autenticação e autorização reais.

---

&copy; 2025 GitHub &bull; [Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/code_of_conduct.md) &bull; [MIT License](https://gh.io/mit)

