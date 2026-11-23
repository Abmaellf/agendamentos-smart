# Investigação da integração de produção

## Resumo executivo

A falha inicial do login em produção tinha duas causas diferentes, identificadas em etapas:

1. O frontend tentava acessar a API usando HTTPS diretamente na porta HTTP `8080`.
2. Depois da implantação do proxy HTTPS, o login passou a retornar `200`, mas as chamadas autenticadas retornavam `403` porque o cookie JWT era emitido com `SameSite=Lax` em um cenário cross-site.

A configuração de DNS, proxy reverso e certificado HTTPS foi posteriormente validada. A pendência funcional é alterar a política `SameSite` do cookie JWT em produção para `None`, mantendo `Secure` e `HttpOnly`.

## Contexto

- Frontend: `https://agendamentos-smart.vercel.app`
- API pública: `https://api-agendamentosmart.com.br`
- Servidor: Hetzner
- IP público validado: `62.238.8.131`
- API interna: porta `8080`
- PostgreSQL interno: porta `5432`
- Proxy reverso: Caddy `2.9.1-alpine`

## 1. Erro inicial do login

O navegador registrava:

```text
ERR_SSL_PROTOCOL_ERROR
```

O request era enviado para:

```text
https://62.238.8.131:8080/auth/login
```

O backend, porém, estava publicado em HTTP na porta `8080`. O frontend era HTTPS, mas não havia uma terminação TLS nessa porta. O navegador falhava durante o handshake TLS, antes de executar o endpoint ou validar CORS.

O frontend usa `VITE_API_URL` como base do Axios e acrescenta `/auth/login`:

- `src/lib/axios.ts` usa `env.VITE_API_URL` como `baseURL`;
- `src/api/sign-in.ts` envia `POST /auth/login`.

## 2. Solução de infraestrutura

Foi adotado um proxy reverso Caddy em Docker:

```text
Internet
  ├── HTTP/80  → Caddy → redireciona para HTTPS
  └── HTTPS/443 → Caddy → API interna:8080
                              └── PostgreSQL interno:5432
```

O Compose de produção deve publicar somente:

```text
proxy: 80 e 443
api: sem porta publicada
postgres: sem porta publicada
```

A API e o PostgreSQL permanecem acessíveis apenas pelas redes Docker internas.

## 3. DNS e domínio

O domínio utilizado foi:

```text
api-agendamentosmart.com.br
```

O registro DNS A foi configurado para:

```text
api-agendamentosmart.com.br → 62.238.8.131
```

O valor usado pelo Caddy em `API_DOMAIN` deve ser somente o domínio, sem protocolo:

```env
API_DOMAIN=api-agendamentosmart.com.br
```

O protocolo HTTPS deve ser usado apenas no frontend:

```env
VITE_API_URL=https://api-agendamentosmart.com.br
```

## 4. Variáveis de produção

O arquivo de ambiente usado pelo Compose de produção deve conter as variáveis obrigatórias, sem placeholders com `<` ou `>`:

```env
SPRING_PROFILES_ACTIVE=prod
APP_VERSION=<versao-real-da-imagem>

AGENDA_DB_NAME=agendamento-smart-api
AGENDA_DB_USER=<usuario-do-banco>
AGENDA_DB_PASSWORD=<senha-do-banco>

JWT_SECRET=<segredo-forte-e-exclusivo>
JWT_COOKIE_SECURE=true
JWT_COOKIE_SAME_SITE=None

API_DOMAIN=api-agendamentosmart.com.br
ACME_EMAIL=<email-de-contato-do-acme>
```

O arquivo deve ficar fora do repositório e ter permissão restrita:

```bash
chmod 600 ~/.config/agendamento-smart/.env
```

Não é necessário executar `source` para o Compose quando o comando utiliza `--env-file`.

O formato correto de `JWT_SECRET` não deve conter `>` no final. Um caractere `>` em um arquivo carregado pelo Bash é interpretado como operador de redirecionamento e causa erro de sintaxe.

Qualquer segredo que tenha sido exposto em terminal, log, screenshot ou conversa deve ser substituído por um novo segredo.

## 5. Certificado HTTPS

O Caddy utiliza ACME/Let's Encrypt para emitir e renovar o certificado automaticamente. Não foi necessário contratar um certificado pago.

O Caddy precisa de:

- DNS apontando para o servidor;
- porta TCP `80` acessível externamente;
- porta TCP `443` acessível externamente;
- `API_DOMAIN` sem `http://` ou `https://`;
- volume persistente `caddy_data`.

## 6. Diagnóstico do primeiro erro de certificado

Inicialmente, o log do Caddy informava:

```text
Timeout during connect (likely firewall problem)
```

A autoridade ACME não conseguia acessar o servidor para os desafios `tls-alpn-01` e `http-01`.

Foi verificado que:

- o DNS resolvia para `62.238.8.131`;
- o Caddy escutava em `0.0.0.0:80` e `0.0.0.0:443`;
- o UFW estava inativo;
- as regras do Docker faziam o DNAT de `80/443` para o container do Caddy;
- o firewall da Hetzner precisava permitir TCP `80` e `443` no servidor correto.

Após a liberação externa, o teste HTTP confirmou:

```text
HTTP/1.1 301 Moved Permanently
Location: https://api-agendamentosmart.com.br/
Server: Caddy
```

## 7. Certificado validado

O teste HTTPS externo confirmou:

- handshake TLS 1.3 concluído;
- certificado para `api-agendamentosmart.com.br`;
- emissor Let's Encrypt;
- Caddy respondendo via HTTP/2;
- API alcançável pelo proxy.

O retorno `403` em `/` não representa falha do HTTPS. A raiz da API exige autenticação. Para validar o TLS, respostas `401`, `403`, `404` ou `405` são aceitáveis, desde que não haja erro de handshake.

## 8. Erro atual de autenticação

Depois da correção do HTTPS, o Network do navegador passou a mostrar:

```text
POST /auth/login → 200
GET /auth/me → 403
GET /api/units → 403
GET /api/services → 403
GET /patient/list → 403
```

Isso prova que:

- o login chega à API;
- as credenciais são aceitas;
- o problema não é mais DNS, TLS ou CORS;
- as requisições posteriores não estão sendo autenticadas.

## 9. Causa do cookie rejeitado

O backend cria o cookie JWT em:

```text
src/main/java/com/agendamento/smart/controller/auth/AuthenticationController.java
```

O código atual fixa:

```java
.sameSite("Lax")
```

O frontend está em `agendamentos-smart.vercel.app` e a API em `api-agendamentosmart.com.br`. Como são sites diferentes, o navegador rejeita ou não envia o cookie `Lax` em chamadas AJAX cross-site.

O cookie de produção precisa ser:

```text
SameSite=None; Secure; HttpOnly
```

## 10. Correção necessária no backend

O valor deve ser configurável, mantendo `Lax` como padrão local e usando `None` em produção.

Exemplo:

```java
@Value("${api.security.cookie.same-site:Lax}")
String jwtCookieSameSite
```

E no cookie:

```java
.sameSite(jwtCookieSameSite)
```

No `application-prod.yaml`:

```yaml
api:
  security:
    cookie:
      secure: ${JWT_COOKIE_SECURE:true}
      same-site: ${JWT_COOKIE_SAME_SITE:None}
```

Depois de recompilar e publicar a API, a resposta de login deve conter algo semelhante a:

```text
Set-Cookie: jwt=...; Path=/; Max-Age=3600; Secure; HttpOnly; SameSite=None
```

## 11. Deploy da correção do cookie

Após a alteração do backend:

```bash
git pull --ff-only

docker compose \
  --env-file ~/.config/agendamento-smart/.env \
  -f compose.production.yml \
  up -d --build --force-recreate api
```

Não executar:

```bash
docker compose down -v
```

Esse comando pode remover o volume persistente do PostgreSQL.

Após o deploy:

1. Limpar os cookies do domínio no navegador ou usar uma janela anônima.
2. Fazer login novamente.
3. Conferir o cabeçalho `Set-Cookie` da resposta `/auth/login`.
4. Confirmar `SameSite=None`, `Secure` e `HttpOnly`.
5. Confirmar que `/auth/me` retorna `200`.

## 12. Banco de dados

O PostgreSQL não deve ser acessado publicamente pela porta `5432`. A conexão externa deve ser feita por túnel SSH.

O acesso direto ao domínio na porta `5432` falha por projeto:

```text
api-agendamentosmart.com.br:5432 → conexão recusada
```

Isso é esperado, pois o Compose de produção não publica a porta do PostgreSQL.

## 13. Checklist final

- [x] DNS aponta para o IP público correto.
- [x] Porta `80` redireciona para HTTPS.
- [x] Porta `443` responde externamente.
- [x] Certificado Let's Encrypt emitido.
- [x] Caddy publica apenas `80/443`.
- [x] API e PostgreSQL não precisam ser expostos diretamente.
- [x] Login retorna `200`.
- [ ] Cookie JWT usa `SameSite=None` em produção.
- [ ] `/auth/me` retorna `200` após o login.
- [ ] Frontend usa `VITE_API_URL=https://api-agendamentosmart.com.br`.
- [ ] Porta `8080` fechada no firewall externo.
- [ ] Porta `5432` fechada no firewall externo.

