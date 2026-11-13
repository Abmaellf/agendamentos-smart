# Spec Delta

## MODIFIED Requirements

### Requirement: A agenda interpreta a sessão tipada

Para carregar a agenda e seus formulários, a aplicação MUST obter `/auth/me` e exigir identificador, login, papel `ADMIN` ou `BASIC`, `tenantId` e `activeUnitId` na resposta usada pela feature. O `activeUnitId` MUST ser o contexto inicial dos controles de unidade para sessões `BASIC`.

#### Scenario: Perfil de sessão utilizado pela agenda

- **WHEN** a página de agenda iniciar a consulta de dados
- **THEN** ela MUST usar a unidade ativa e o papel retornados pelo perfil de sessão

#### Scenario: Sessão BASIC inicializa o formulário

- **WHEN** o diálogo de agendamento abrir com uma sessão `BASIC` válida
- **THEN** o controle de unidade MUST ser inicializado com `activeUnitId` e MUST permanecer sem edição pelo usuário

#### Scenario: Perfil incompleto

- **WHEN** a resposta de `/auth/me` não contiver um `activeUnitId` válido
- **THEN** a aplicação MUST tratar a sessão como inválida para a agenda e MUST impedir uma criação baseada em unidade escolhida pelo cliente
