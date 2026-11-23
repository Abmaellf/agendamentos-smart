# Spec Delta

## ADDED Requirements

### Requirement: O menu de conta encerra a sessão

A opção “Sair” do menu de conta MUST solicitar o encerramento da sessão e retirar a pessoa da área autenticada.

#### Scenario: Logout concluído

- **WHEN** uma pessoa autenticada ativar “Sair” e a API concluir `POST /auth/logout`
- **THEN** a aplicação MUST fechar o menu, limpar o estado de dados autenticados, navegar para `/sign-in` e exibir confirmação de saída

#### Scenario: Logout indisponível na API

- **WHEN** uma pessoa autenticada ativar “Sair” e a chamada de logout falhar por rede ou por sessão já expirada
- **THEN** a aplicação MUST limpar o estado local, navegar para `/sign-in` e não manter a área autenticada acessível pela interface atual

#### Scenario: Ação de saída no menu aberto

- **WHEN** uma pessoa abrir o menu de conta
- **THEN** encontrará uma ação nomeada “Sair” com semântica de controle acionável e sem exigir uma rota intermediária
