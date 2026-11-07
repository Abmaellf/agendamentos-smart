# Spec Delta

## MODIFIED Requirements

### Requirement: Perfil e notificações são acessíveis no topbar

O topbar MUST apresentar um controle de notificações e um controle de perfil com avatar, identificação disponível da conta e indicador visual de expansão. O indicador de notificações não pode ser tratado como fonte de autorização ou dado remoto novo nesta change.

#### Scenario: Acessar o menu de perfil

- **WHEN** uma pessoa ativar o controle de avatar ou perfil
- **THEN** a aplicação MUST abrir o menu de conta existente com a identificação disponível do perfil e sem exigir uma nova rota de perfil

#### Scenario: Abrir os detalhes do perfil

- **WHEN** uma pessoa ativar a opção “Perfil” no menu de conta
- **THEN** a aplicação MUST abrir o modal de detalhes do perfil sobre a rota atual, mantendo o menu e o topbar fora do fluxo de navegação

#### Scenario: Identificar notificações

- **WHEN** o topbar for renderizado
- **THEN** o controle de notificações MUST ter nome acessível e, quando houver uma contagem de não lidas fornecida pela interface, MUST exibir essa contagem em um indicador visual separado

#### Scenario: Ativar notificações sem fluxo entregue

- **WHEN** uma pessoa ativar o controle de notificações enquanto não houver fluxo de notificações implementado
- **THEN** a aplicação MUST manter a rota e não iniciar chamada HTTP ou operação de domínio não especificada
