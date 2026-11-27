# Spec Delta

## Purpose

Define o endereço HTTPS público e a política de acesso entre o frontend
publicado em `compromiz.com.br` e a API externa, evitando que o navegador
dependa de cookies de terceiro ou de redirecionamentos durante o preflight.

## ADDED Requirements

### Requirement: A API possui um host HTTPS público canônico

A API MUST estar acessível por `https://api.compromiz.com.br` com certificado válido e sem expor a porta interna da aplicação.

#### Scenario: Resolução e acesso ao host público

- **WHEN** um cliente resolver `api.compromiz.com.br` e fizer uma requisição HTTPS
- **THEN** o proxy público MUST concluir o TLS e encaminhar a requisição para a API sem redirecionar para IP privado, porta interna ou outro host

#### Scenario: Endpoint protegido sem sessão

- **WHEN** um cliente acessar um endpoint protegido no host canônico sem credenciais
- **THEN** a API MUST responder com um status de autenticação/autorização documentado e a conexão MUST permanecer em `api.compromiz.com.br`

### Requirement: A origem pública do frontend é autorizada com credenciais

A API MUST autorizar a origem exata `https://compromiz.com.br` para requisições do frontend que utilizam credenciais.

#### Scenario: Requisição autenticada originada pelo frontend

- **WHEN** uma requisição do frontend incluir `Origin: https://compromiz.com.br`
- **THEN** a resposta MUST informar essa origem exata, permitir credenciais e MUST NOT usar `*` como origem permitida

#### Scenario: Origem não autorizada

- **WHEN** uma requisição vier de uma origem que não esteja na lista aprovada
- **THEN** a API MUST rejeitar a origem sem conceder acesso credenciado aos recursos

### Requirement: O preflight CORS é atendido diretamente

O preflight CORS dos endpoints usados pelo frontend MUST ser atendido diretamente pela borda/API, sem exigir sessão e sem redirecionamento.

#### Scenario: Preflight do login

- **WHEN** o navegador enviar `OPTIONS /auth/login` com método solicitado `POST` e header solicitado `content-type`
- **THEN** a API MUST responder `200` ou `204` com os métodos, headers, origem e credenciais compatíveis, sem o header `Location`

#### Scenario: Preflight de recurso protegido

- **WHEN** o navegador enviar um preflight para `/auth/me` ou para um endpoint de dados usando credenciais
- **THEN** a resposta MUST ser diretamente utilizável pelo navegador e MUST ocorrer antes de qualquer validação do cookie de sessão
