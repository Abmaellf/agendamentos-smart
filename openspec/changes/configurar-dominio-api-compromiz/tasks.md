# Tasks

## 1. DNS e publicação HTTPS

- [x] 1.1 Criar o registro DNS `api.compromiz.com.br` apontando para o servidor público da API e verificar a resolução com `dig +short api.compromiz.com.br`. Evidência: o DNS resolve para `62.238.8.131`.
- [ ] 1.2 Atualizar `API_DOMAIN=api.compromiz.com.br` no ambiente usado pelo `compose.production.yml` e verificar que o Caddy utiliza o novo host sem protocolo ou porta.
- [ ] 1.3 Recriar o serviço `proxy` sem remover volumes persistentes e verificar certificado TLS válido, ausência de redirecionamento para IP privado e encaminhamento para a API interna.

## 2. CORS e sessão no backend

- [ ] 2.1 Atualizar `SecurityConfiguration.java` para autorizar exatamente `https://compromiz.com.br`, manter credenciais, `OPTIONS` e os métodos/headers necessários, e verificar o preflight sem autenticação.
- [ ] 2.2 Manter `JWT_COOKIE_SECURE=true` e `JWT_COOKIE_SAME_SITE=None` em `application-prod.yaml`/ambiente de produção, verificar `Set-Cookie` com `Secure`, `HttpOnly` e `SameSite=None`, e não adicionar o host da API às variáveis `JWT_COOKIE_*`.
- [ ] 2.3 Garantir que `OPTIONS /auth/login` e os preflights dos endpoints protegidos respondam `200` ou `204`, sem `Location`, e verificar com `curl -i -X OPTIONS` usando `Origin: https://compromiz.com.br`.
- [ ] 2.4 Recriar o serviço `api` sem apagar o banco e verificar que login, `/auth/me` e um endpoint protegido respondem pelo host `api.compromiz.com.br`.

## 3. Frontend e publicação Vercel

- [ ] 3.1 Alterar a variável de produção `VITE_API_URL` para `https://api.compromiz.com.br` e verificar no bundle publicado que o host antigo não aparece como base da API.
- [ ] 3.2 Fazer novo deploy do frontend em `https://compromiz.com.br` e verificar carregamento do bundle, rotas SPA e ausência de erro de certificado ou redirecionamento da API.
- [ ] 3.3 Manter `withCredentials: true` no cliente HTTP existente e verificar no Network que o login não cria uma segunda chamada sem credenciais.

## 4. Validação integrada e segurança

- [ ] 4.1 Limpar cookies dos hosts antigo e novo, autenticar em janela normal, janela privada e dispositivo móvel, e verificar `Cookie: jwt=...` na requisição `GET /auth/me`.
- [ ] 4.2 Verificar que `/auth/me` retorna `200` e que `/api/units`, `/api/services`, `/api/appointments` e `/patient/list` carregam dados sem `401`, `403` ou erro CORS causado pela ausência de cookie.
- [ ] 4.3 Revogar as sessões/refresh tokens expostos nas capturas do diagnóstico e verificar que um token revogado não acessa `/auth/me`.
- [x] 4.4 Atualizar a documentação de produção com os hosts `compromiz.com.br` e `api.compromiz.com.br`, o procedimento de deploy seguro e os comandos de verificação; validar o diff documental e o comando `openspec validate configurar-dominio-api-compromiz --strict`. Evidência: `docs/GUIA-DOMINIO-COMPRIZ-API.md` criado, índice `docs/README.md` atualizado, `git diff --check` e `openspec validate configurar-dominio-api-compromiz --strict` aprovados.

## Workflow follow-up

- Arquivar a change somente depois que as tarefas externas de DNS, API, Vercel e validação integrada tiverem evidência real.
