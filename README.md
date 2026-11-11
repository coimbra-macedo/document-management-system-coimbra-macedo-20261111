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

As rotas `POST /upload`, `GET /documents` e `GET /documents/:id/download` exigem o cabeçalho `X-User-Id`. O upload usa `multipart/form-data` com o campo `file`. Os metadados permanecem em memória e são perdidos ao reiniciar o servidor. O cabeçalho identifica o usuário, mas não fornece autenticação.

---

&copy; 2025 GitHub &bull; [Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/code_of_conduct.md) &bull; [MIT License](https://gh.io/mit)

