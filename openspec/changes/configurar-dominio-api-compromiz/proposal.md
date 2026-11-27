# Proposal

## Why

O frontend foi publicado em `https://compromiz.com.br`, mas a API ainda é
acessada por `https://api-agendamentosmart.com.br`. O navegador armazena os
cookies de sessão, porém não os envia em `/auth/me` como cookies de terceiro,
impedindo a leitura do perfil e dos dados protegidos, especialmente em
navegação privada e dispositivos móveis.

Esta change configura a API sob `api.compromiz.com.br`, alinha DNS, Caddy,
CORS e o build do frontend, e estabelece verificações explícitas para confirmar
que a sessão chega à API antes de liberar o deploy.

## What Changes

- Criar o registro DNS de `api.compromiz.com.br` apontando para o servidor público da API.
- Configurar o Caddy/Compose de produção para usar `API_DOMAIN=api.compromiz.com.br` e emitir o certificado HTTPS desse host.
- Atualizar o CORS do backend para aceitar a origem exata `https://compromiz.com.br`, mantendo `OPTIONS`, credenciais e as origens de transição necessárias.
- Manter os cookies de sessão com `Secure`, `HttpOnly` e `SameSite=None`, sem confundir o domínio público da API com `JWT_COOKIE_SECURE` ou `JWT_COOKIE_SAME_SITE`.
- Atualizar `VITE_API_URL` no ambiente de produção da Vercel para `https://api.compromiz.com.br` e gerar novo build.
- Recriar o proxy e a API sem remover volumes persistentes do banco.
- Validar DNS, TLS, preflight CORS, emissão do cookie, envio do cookie em `/auth/me` e carregamento dos endpoints protegidos.
- Revogar sessões/tokens expostos durante o diagnóstico antes da validação final.

Fora de escopo:

- Alterar regras de negócio, autorização por tenant ou contratos de payload dos endpoints.
- Migrar a autenticação de cookies HttpOnly para `localStorage`, `Authorization` ou outro mecanismo.
- Implementar a Storage Access API como solução de produção.
- Alterar o layout responsivo ou a renderização das telas de agenda, pacientes e pacotes.

## Capabilities

### New Capabilities

- `api-publication-domain`: publicação HTTPS da API em `api.compromiz.com.br`, com DNS, proxy reverso, CORS e preflight compatíveis com o frontend em `compromiz.com.br`.

### Modified Capabilities

- `access-session-baseline`: a sessão criada pelo login deve permanecer utilizável pelo frontend publicado em `compromiz.com.br`, permitindo que `/auth/me` receba o cookie e que as consultas autenticadas sejam iniciadas.

## Impact

- API irmã: `application-prod.yaml`, `SecurityConfiguration.java`, configuração do cookie e configuração de CORS.
- Infraestrutura: provedor DNS, `compose.production.yml`, Caddy, certificado ACME e variáveis do ambiente de produção.
- Frontend: variável de build `VITE_API_URL` no projeto da Vercel; a instância Axios existente continua usando credenciais.
- Contratos HTTP: a origem pública autorizada e o host HTTPS da API mudam; métodos, caminhos e payloads permanecem inalterados.
- Operação: será necessário recriar os serviços `proxy` e `api`, sem executar comandos que removam o volume do banco.
- Evidência de conclusão: o Network do navegador deve mostrar `Cookie: jwt=...` em `/auth/me`, resposta `200` e carregamento subsequente dos dados protegidos.
