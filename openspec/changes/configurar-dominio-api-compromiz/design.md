# Design

## Context

Consulte `proposal.md` para a motivação. O frontend está publicado em
`https://compromiz.com.br`, enquanto o bundle atual ainda aponta para
`https://api-agendamentosmart.com.br`. A API já emite cookies `Secure`,
`HttpOnly` e `SameSite=None`, mas o navegador os armazena e não os envia em
`/auth/me` como cookies de terceiro. O preflight CORS também precisa ser
respondido diretamente, sem redirecionamento.

O backend irmão não está neste checkout. A implementação deverá ser feita no
repositório/servidor da API, seguindo os arquivos e variáveis documentados:
`application-prod.yaml`, `SecurityConfiguration.java`, `compose.production.yml`,
Caddy e o arquivo de ambiente externo do Compose.

## Goals / Non-Goals

**Goals:**

- Fazer frontend e API compartilharem o site `compromiz.com.br` por meio de
  `api.compromiz.com.br`.
- Preservar cookies HttpOnly e o envio de credenciais pelo cliente existente.
- Garantir TLS válido, preflight sem redirecionamento e CORS com origem exata.
- Permitir rollout gradual mantendo a origem antiga durante a transição.
- Validar o fluxo completo em janela normal, janela privada e dispositivo móvel.

**Non-Goals:**

- Alterar o contrato dos endpoints ou o formato do JWT.
- Remover a proteção de cookies ou transferir tokens para armazenamento acessível
  ao JavaScript.
- Resolver autorização de negócio, isolamento de tenant ou regras de agenda.
- Usar Storage Access API ou liberar cookies de terceiros como dependência do
  produto.

## Decisions

### Domínio canônico da API

Usar `api.compromiz.com.br` como host público da API. O DNS apontará o subdomínio
para o servidor público existente; o Caddy terminará TLS e encaminhará para a
porta interna da API. A porta interna e o PostgreSQL continuarão sem exposição
pública.

Alternativa descartada: manter `api-agendamentosmart.com.br` e depender de
`SameSite=None` para cookies de terceiro. A captura do navegador demonstrou que
o cookie é armazenado, mas não acompanha `/auth/me`, especialmente em contexto
privado/mobile.

### Configuração de produção

`API_DOMAIN` será alterado para `api.compromiz.com.br` no ambiente consumido pelo
Compose/Caddy. `JWT_COOKIE_SECURE` e `JWT_COOKIE_SAME_SITE` permanecerão como
configurações independentes, pois descrevem atributos do cookie, não o nome do
host público.

Alternativa descartada: colocar o novo domínio em `JWT_COOKIE_*`. Isso mistura
responsabilidades e não altera o roteamento DNS nem o certificado.

### CORS

O backend manterá `allowCredentials=true`, `OPTIONS` entre os métodos permitidos
e uma lista de origens exatas que inclua `https://compromiz.com.br`. A origem
antiga da Vercel poderá permanecer durante a migração. O preflight será tratado
antes da autenticação e não poderá retornar `Location`.

Alternativa descartada: wildcard `*`. Ele não é compatível com requisições
credenciadas e poderia mascarar uma origem não autorizada.

### Cliente frontend

Alterar somente a variável de build `VITE_API_URL` na Vercel para
`https://api.compromiz.com.br`. A instância Axios existente continuará com
`withCredentials: true`; não será criada uma segunda camada HTTP.

### Rollout e reversibilidade

Publicar primeiro DNS/TLS e backend, validar o preflight, depois atualizar o
ambiente da Vercel e fazer novo build. Manter o host antigo e a origem antiga
autorizados até confirmar o novo fluxo. Em caso de falha, restaurar
`VITE_API_URL` e `API_DOMAIN` para os valores anteriores, sem apagar volumes do
banco.

## Risks / Trade-offs

- **[Risco] DNS ou ACME ainda não propagados** → validar resolução, certificado e
  resposta HTTPS antes do deploy do frontend.
- **[Risco] Caddy redirecionar `OPTIONS`** → testar `OPTIONS /auth/login` e
  `/auth/me` sem `-L`; exigir `200/204` e ausência de `Location`.
- **[Risco] A API continuar recebendo chamadas pelo host antigo** → inspecionar o
  bundle publicado e o Network após o deploy; nenhum endpoint deve usar o host
  antigo.
- **[Risco] Cookies antigos confundirem a validação** → limpar cookies dos dois
  hosts e repetir o login em janela privada.
- **[Risco] Tokens expostos no diagnóstico permanecerem válidos** → revogar a
  sessão/refresh token antes da validação final e não registrar valores em logs.
- **[Risco] Backend retornar `403` para sessão ausente** → registrar a diferença
  entre autenticação e autorização; a mudança de status HTTP fica fora deste
  rollout, salvo se for necessária para o fluxo de sessão.

## Migration Plan

1. Criar `api.compromiz.com.br` no DNS apontando para o servidor da API.
2. Atualizar `API_DOMAIN` no ambiente do Compose/Caddy e recriar o proxy para
   emitir o certificado do novo host.
3. Atualizar a origem CORS para `https://compromiz.com.br`, preservando a origem
   antiga durante a transição, e confirmar `OPTIONS` sem autenticação ou
   redirecionamento.
4. Recriar a API com `JWT_COOKIE_SECURE=true` e
   `JWT_COOKIE_SAME_SITE=None`, sem `docker compose down -v`.
5. Alterar `VITE_API_URL` na Vercel e publicar novo build.
6. Limpar sessões antigas, autenticar novamente e verificar `Set-Cookie`,
   `Cookie` em `/auth/me`, `200` no perfil e sucesso dos endpoints de dados.
7. Repetir a validação em desktop, janela privada e mobile usando a rede de
   produção.
8. Remover a origem/host antigo somente após a evidência do novo fluxo e após
   revogar tokens expostos.

## Open Questions

- O provedor DNS e o projeto Caddy já administram certificados para múltiplos
  hosts ou exigem uma alteração adicional no volume ACME? Isso não muda a
  arquitetura escolhida, apenas o comando operacional do deploy.
