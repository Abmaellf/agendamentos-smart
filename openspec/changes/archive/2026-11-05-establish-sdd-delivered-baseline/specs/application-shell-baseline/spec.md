# Spec Delta

## Purpose

Define a composição atualmente entregue da aplicação web, suas entradas de navegação e os limites explícitos das telas ainda iniciais.

## ADDED Requirements

### Requirement: A aplicação expõe as rotas entregues

A SPA MUST disponibilizar as rotas `/`, `/sign-in`, `/sign-up`, `/appointments`, `/paciente`, `/doctor` e `/configuration` na composição atual do roteador.

#### Scenario: Navegação para uma rota conhecida

- **WHEN** o navegador acessar uma rota declarada
- **THEN** a aplicação MUST renderizar o componente associado àquela rota dentro do layout aplicável

### Requirement: Áreas autenticadas usam a casca visual comum

As rotas de agenda, pacientes, profissional e configuração MUST usar o layout interno compartilhado, enquanto login e cadastro usam o layout de autenticação.

#### Scenario: Entrada na agenda

- **WHEN** a rota `/appointments` for renderizada
- **THEN** a página MUST ser composta dentro do layout interno da aplicação

### Requirement: Telas sem fluxo completo permanecem identificáveis

As rotas de profissional e configuração MUST continuar acessíveis como telas iniciais, sem representar que seus cadastros ou configurações já estejam implementados.

#### Scenario: Acesso a profissional ou configuração

- **WHEN** uma pessoa navegar para `/doctor` ou `/configuration`
- **THEN** a interface MUST apresentar a tela disponível sem executar operação de domínio não implementada
