# Spec Delta

## REMOVED Requirements

### Requirement: A entrada inicial decide pelo cookie de sessão

Na rota raiz, a aplicação MUST verificar a presença do cookie `jwt` e encaminhar a pessoa para login ou agenda conforme essa presença.

#### Scenario: Pessoa sem cookie jwt

- **WHEN** a pessoa acessar `/` sem o cookie `jwt`
- **THEN** a aplicação MUST encaminhá-la para `/sign-in`

#### Scenario: Pessoa com cookie jwt

- **WHEN** a pessoa acessar `/` com o cookie `jwt`
- **THEN** a aplicação MUST encaminhá-la para `/appointments`

**Reason**: Cookies de sessão são `HttpOnly` e sua presença não comprova que a sessão ainda é válida.
**Migration**: Usar a validação autenticada descrita em “A entrada inicial valida a sessão ativa”.

## ADDED Requirements

### Requirement: A entrada inicial valida a sessão ativa

Na rota raiz, a aplicação MUST validar a sessão com a API antes de encaminhar a pessoa para a área interna ou pública.

#### Scenario: Sessão válida na entrada

- **WHEN** a pessoa acessar `/` e a API confirmar sua sessão, diretamente ou após refresh
- **THEN** a aplicação MUST encaminhá-la para `/appointments`

#### Scenario: Sessão ausente ou inválida na entrada

- **WHEN** a pessoa acessar `/` e a API rejeitar a sessão, inclusive após uma tentativa de refresh
- **THEN** a aplicação MUST encaminhá-la para `/sign-in` sem exibir a agenda autenticada

### Requirement: O frontend renova uma sessão expirada uma única vez

Ao receber `401` em uma requisição autenticada, a aplicação MUST tentar `POST /auth/refresh` uma vez e repetir a requisição original somente após refresh bem-sucedido.

#### Scenario: Refresh bem-sucedido

- **WHEN** uma requisição autenticada receber `401` e o refresh token da sessão for válido
- **THEN** a aplicação MUST repetir a requisição original uma vez e entregar seu resultado ao fluxo que a iniciou

#### Scenario: Refresh rejeitado

- **WHEN** uma requisição autenticada receber `401` e `POST /auth/refresh` também for rejeitado
- **THEN** a aplicação MUST invalidar o estado local da API, encaminhar a pessoa para `/sign-in` e não repetir indefinidamente a requisição original

#### Scenario: Várias requisições expiram juntas

- **WHEN** duas ou mais requisições autenticadas receberem `401` durante a mesma expiração
- **THEN** a aplicação MUST compartilhar uma única tentativa de refresh e aguardar seu resultado antes de repetir as requisições elegíveis

### Requirement: O frontend não persiste segredos de sessão

O frontend MUST depender de cookies de sessão enviados com credenciais e MUST NOT persistir access token ou refresh token em `localStorage`, `sessionStorage`, URL ou logs.

#### Scenario: Login ou refresh concluído

- **WHEN** a API concluir login ou refresh
- **THEN** a aplicação MUST continuar operando sem gravar qualquer token de sessão em armazenamento acessível ao JavaScript
