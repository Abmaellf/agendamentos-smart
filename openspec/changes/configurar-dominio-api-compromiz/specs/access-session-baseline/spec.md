# Spec Delta

## ADDED Requirements

### Requirement: A sessão publicada é reutilizada nas consultas autenticadas

Após um login bem-sucedido no frontend publicado em `https://compromiz.com.br`, a sessão emitida pela API MUST ser enviada nas consultas autenticadas subsequentes e permitir a leitura do perfil e dos dados protegidos.

#### Scenario: Login cria sessão utilizável no host canônico

- **WHEN** a API responder com sucesso ao `POST /auth/login` originado de `https://compromiz.com.br`
- **THEN** o navegador MUST armazenar os cookies de sessão emitidos para `api.compromiz.com.br` com `Secure`, `HttpOnly` e política `SameSite` compatível com a publicação

#### Scenario: Perfil autenticado recebe a sessão

- **WHEN** o frontend chamar `GET https://api.compromiz.com.br/auth/me` após o login
- **THEN** a requisição MUST incluir o cookie de sessão e a API MUST responder `200` com um perfil válido para a agenda

#### Scenario: Dados protegidos são carregados após o perfil

- **WHEN** `/auth/me` confirmar uma sessão válida
- **THEN** as consultas protegidas da agenda MUST poder ser iniciadas e MUST receber respostas da API sem erro de autenticação causado pela ausência do cookie
