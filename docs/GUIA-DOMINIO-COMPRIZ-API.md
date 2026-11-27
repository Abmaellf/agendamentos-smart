# Guia de publicação: `compromiz.com.br` e `api.compromiz.com.br`

## Objetivo

Este documento descreve, passo a passo, a publicação do frontend em:

```text
https://compromiz.com.br
```

e da API em:

```text
https://api.compromiz.com.br
```

O subdomínio da API aponta por CNAME para o host já publicado:

```text
api.compromiz.com.br → api-agendamentosmart.com.br
```

O frontend e a API passam a compartilhar o mesmo domínio-base
`compromiz.com.br`, reduzindo a dependência de cookies de terceiro em
navegadores mobile e em navegação privada.

> Não coloque valores reais de senha, `JWT_SECRET`, tokens ou refresh tokens
> neste documento, em logs ou em capturas de tela.

## 1. Arquitetura final

```text
Navegador
   │
   ├── https://compromiz.com.br
   │       └── Vercel → SPA React/Vite
   │
   └── https://api.compromiz.com.br
           └── CNAME → api-agendamentosmart.com.br
                           └── Caddy :443
                                   └── API interna :8080
                                           └── Banco interno
```

O PostgreSQL e a porta interna `8080` não devem ser publicados diretamente na
Internet.

## 2. Domínio do frontend na Vercel

1. Acesse o projeto do frontend na Vercel.
2. Abra `Settings` → `Domains`.
3. Adicione `compromiz.com.br`.
4. Configure no provedor DNS os registros exibidos pela Vercel.
5. Aguarde a validação do domínio e a emissão do certificado HTTPS.
6. Confirme que o domínio abre a aplicação e que `/appointments` retorna o
   `index.html` em vez de `404`.

## 3. Subdomínio da API no DNS

No provedor DNS de `compromiz.com.br`, crie:

```text
Tipo:     CNAME
Nome:     api
Destino:  api-agendamentosmart.com.br
TTL:      automático ou o padrão do provedor
```

O resultado deve ser:

```text
api.compromiz.com.br → api-agendamentosmart.com.br
```

Não use `https://`, porta ou caminho no destino do CNAME.

Valide:

```bash
dig +short CNAME api.compromiz.com.br
dig +short api.compromiz.com.br
```

O primeiro comando deve mostrar `api-agendamentosmart.com.br` ou o destino
canônico equivalente. O segundo deve resolver para o endereço público do
servidor da API, atualmente `62.238.8.131`.

## 4. Arquivo de ambiente do servidor

O arquivo usado pelo Compose de produção é:

```text
~/.config/agendamento-smart/.env
```

Como esse arquivo é passado ao Docker Compose com `--env-file`, ele deve usar
uma variável por linha, no formato `NOME=VALOR`.

### Formato correto

```env
SPRING_PROFILES_ACTIVE=prod
AGENDA_DB_USER=<valor-real>
AGENDA_DB_PASSWORD=<valor-real>
AGENDA_DB_NAME=<valor-real>

# Opcional, somente se usado pelo Compose:
# AGENDA_URL=<valor-real>

AGENDA_APP_DIR=<valor-real>
AGENDA_ENV_FILE=<valor-real>
AGENDA_DB_BIND_ADDRESS=<valor-real>
AGENDA_DB_PORT=5432

JWT_SECRET=<segredo-real>

AGENDA_API_BIND_ADDRESS=<valor-real>
AGENDA_API_PORT=8080
APP_VERSION=<versao-real>

JWT_COOKIE_SECURE=true
JWT_COOKIE_SAME_SITE=None

API_DOMAIN=api.compromiz.com.br
ACME_EMAIL=<email-real>
```

Os valores entre `<...>` são exemplos e não devem ser mantidos literalmente.

### Formatos incorretos

Não use `export` nem barras `\` no final das linhas:

```bash
export API_DOMAIN=api.compromiz.com.br\
```

Nem:

```env
export API_DOMAIN=api.compromiz.com.br
API_DOMAIN=api.compromiz.com.br\
```

Barras `\` podem ser usadas para continuação de comandos no shell, mas não
fazem parte do formato normal do arquivo passado ao Compose.

O domínio público da API é configurado por:

```env
API_DOMAIN=api.compromiz.com.br
```

Ele não deve ser colocado em `JWT_COOKIE_SECURE` ou `JWT_COOKIE_SAME_SITE`.

Proteja o arquivo:

```bash
chmod 600 ~/.config/agendamento-smart/.env
```

## 5. Caddy e certificado HTTPS

O Caddy deve obter o domínio a partir de `API_DOMAIN` ou utilizar diretamente
`api.compromiz.com.br` no `Caddyfile`.

Procure configurações antigas:

```bash
grep -R -n \
  'API_DOMAIN\|api-agendamentosmart.com.br\|api.compromiz.com.br' \
  compose.production.yml Caddyfile
```

Se o `Caddyfile` usar variável, a estrutura esperada é equivalente a:

```caddyfile
{$API_DOMAIN} {
    reverse_proxy api:8080
}
```

O nome real do serviço pode variar conforme o Compose. Preserve o nome já
utilizado no projeto.

Valide a variável dentro do proxy:

```bash
docker compose exec proxy printenv API_DOMAIN
```

Resultado esperado:

```text
api.compromiz.com.br
```

Recrie somente o proxy:

```bash
docker compose \
  --env-file ~/.config/agendamento-smart/.env \
  -f compose.production.yml \
  up -d --force-recreate proxy
```

Não execute `docker compose down -v`, pois esse comando pode remover volumes
persistentes do banco.

Valide os logs:

```bash
docker compose \
  --env-file ~/.config/agendamento-smart/.env \
  -f compose.production.yml \
  logs --tail=100 proxy
```

O log deve listar o novo domínio, por exemplo:

```text
domains:["api.compromiz.com.br"]
```

Avisos de OCSP stapling, isoladamente, não significam que o certificado está
inválido. O certificado precisa conter `api.compromiz.com.br` no SAN.

Valide o certificado:

```bash
openssl s_client \
  -connect api.compromiz.com.br:443 \
  -servername api.compromiz.com.br </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -ext subjectAltName
```

O resultado deve conter:

```text
DNS:api.compromiz.com.br
```

## 6. Configuração do backend Spring

### Cookies de sessão

No `application-prod.yaml`, mantenha:

```yaml
api:
  security:
    cookie:
      secure: ${JWT_COOKIE_SECURE:true}
      same-site: ${JWT_COOKIE_SAME_SITE:None}
```

O login deve emitir cookies com:

```text
Secure; HttpOnly; SameSite=None
```

Não armazene tokens em `localStorage` ou `sessionStorage`.

### CORS

No `SecurityConfiguration.java`, autorize a origem exata do frontend:

```java
config.setAllowedOrigins(List.of(
        "https://compromiz.com.br",
        "https://agendamentos-smart.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173"
));

config.setAllowedMethods(List.of(
        "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
config.setAllowedHeaders(List.of("*"));
config.setAllowCredentials(true);
config.setMaxAge(3600L);
```

A origem antiga da Vercel pode permanecer durante a transição. Depois da
validação definitiva, ela pode ser removida.

O preflight deve ser processado sem exigir JWT e sem redirecionar:

```bash
curl -i -X OPTIONS https://api.compromiz.com.br/auth/login \
  -H 'Origin: https://compromiz.com.br' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type'
```

Esperado:

```http
HTTP/2 200
Access-Control-Allow-Origin: https://compromiz.com.br
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS,PATCH
```

O preflight não deve retornar `Location` nem redirecionar para IP privado,
portal cativo ou outro domínio.

## 7. Recriar a API

Depois de atualizar o ambiente e o backend:

```bash
docker compose \
  --env-file ~/.config/agendamento-smart/.env \
  -f compose.production.yml \
  up -d --build --force-recreate api proxy
```

Verifique:

```bash
docker compose ps
docker compose logs --tail=100 api
docker compose logs --tail=100 proxy
```

## 8. Configuração do frontend na Vercel

No projeto da Vercel, configure a variável de produção:

```env
VITE_API_URL=https://api.compromiz.com.br
```

Depois faça um novo deploy. Essa variável é incorporada ao bundle pelo Vite;
alterá-la na Vercel sem novo build não atualiza o JavaScript já publicado.

O cliente Axios deve continuar configurado com credenciais:

```ts
axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
})
```

## 9. Validação do fluxo de autenticação

1. Remova os cookies de `api-agendamentosmart.com.br` e
   `api.compromiz.com.br`.
2. Acesse `https://compromiz.com.br`.
3. Faça login.
4. Em `Network`, abra `POST /auth/login`.
5. Confirme `Set-Cookie` com `Secure`, `HttpOnly` e `SameSite=None`.
6. Abra `GET https://api.compromiz.com.br/auth/me`.
7. Confirme que a requisição contém `Cookie: jwt=...`.
8. Confirme resposta `200` em `/auth/me`.
9. Confirme carregamento de `/api/units`, `/api/services`,
   `/api/appointments` e `/patient/list`.
10. Repita em navegador normal, navegação privada, dispositivo mobile, rede
    Wi-Fi e rede móvel quando possível.

## 10. Diagnóstico rápido

### O container mostra o domínio antigo

Verifique se o `.env` contém `API_DOMAIN=api.compromiz.com.br`, sem `export` e
sem `\`, e recrie o container com `--force-recreate`.

### O DNS resolve, mas o TLS falha

Verifique se o Caddy recebeu o novo `API_DOMAIN`, se as portas `80` e `443`
estão acessíveis e se o log lista `api.compromiz.com.br`.

### O preflight retorna `303`

Existe um redirecionamento no Caddy, firewall ou proxy. O `OPTIONS` deve
responder diretamente `200` ou `204`, sem `Location`.

### `/auth/me` retorna `403` sem header `Cookie`

A API está recebendo a requisição sem sessão. Verifique o domínio do cookie, o
host usado pelo frontend e as políticas de cookies do navegador.

### `/auth/me` retorna `403` mesmo com `Cookie`

Verifique validade, revogação, assinatura e permissões do JWT no backend. Não
confunda falha de autenticação com falha de CORS.

## 11. Segurança

- Não versionar `.env` ou qualquer arquivo com segredo.
- Não imprimir `JWT_SECRET`, `jwt` ou `refresh_token` em logs.
- Revogar tokens exibidos em capturas ou terminais.
- Não executar `docker compose down -v` em produção.
- Manter PostgreSQL e a porta interna da API sem exposição pública.
