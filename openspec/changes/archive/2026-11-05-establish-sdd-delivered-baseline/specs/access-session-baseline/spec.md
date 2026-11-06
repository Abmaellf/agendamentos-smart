# Spec Delta

## Purpose

Registra o comportamento atual de entrada, redirecionamento inicial e sessão que sustenta a agenda integrada à API externa.

## ADDED Requirements

### Requirement: A entrada inicial decide pelo cookie de sessão

Na rota raiz, a aplicação MUST verificar a presença do cookie `jwt` e encaminhar a pessoa para login ou agenda conforme essa presença.

#### Scenario: Pessoa sem cookie jwt

- **WHEN** a pessoa acessar `/` sem o cookie `jwt`
- **THEN** a aplicação MUST encaminhá-la para `/sign-in`

#### Scenario: Pessoa com cookie jwt

- **WHEN** a pessoa acessar `/` com o cookie `jwt`
- **THEN** a aplicação MUST encaminhá-la para `/appointments`

### Requirement: Login envia as credenciais à API

A tela de login MUST enviar `login` e `password` para `POST /auth/login`, apresentar confirmação e navegar para a agenda quando a chamada for bem-sucedida.

#### Scenario: Credenciais aceitas pela API

- **WHEN** o formulário de login for enviado e a API responder com sucesso
- **THEN** a interface MUST navegar para `/appointments` e exibir confirmação de conexão

#### Scenario: Credenciais recusadas pela API

- **WHEN** o formulário de login receber erro da API
- **THEN** a interface MUST permanecer no fluxo de login e exibir mensagem de credenciais inválidas

### Requirement: A agenda interpreta a sessão tipada

Para carregar a agenda, a aplicação MUST obter `/auth/me` e exigir identificador, login, papel `ADMIN` ou `BASIC`, `tenantId` e `activeUnitId` na resposta usada pela feature.

#### Scenario: Perfil de sessão utilizado pela agenda

- **WHEN** a página de agenda iniciar a consulta de dados
- **THEN** ela MUST usar a unidade ativa e o papel retornados pelo perfil de sessão
