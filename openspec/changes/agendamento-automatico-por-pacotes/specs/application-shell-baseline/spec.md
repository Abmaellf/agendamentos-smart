# Spec Delta

## MODIFIED Requirements

### Requirement: O topbar apresenta as ações globais da referência
O topbar das rotas internas MUST apresentar busca, navegação de data, as ações
“Agendar” e “Agendamento de Pacotes” quando os respectivos fluxos estiverem
disponíveis para a sessão, notificações e acesso ao perfil, com nomes acessíveis
e sem sobrepor o conteúdo em telas amplas ou compactas. As duas ações MUST
permanecer funcionalmente distintas.

#### Scenario: Exibição das ações do topbar
- **WHEN** uma rota interna for renderizada para uma sessão elegível
- **THEN** o topbar MUST exibir um campo de busca, o controle “Hoje”, a data corrente, controles de período anterior e próximo, o controle de notificações, o controle de perfil, o botão “Agendar” e o botão “Agendamento de Pacotes”

#### Scenario: Abertura do fluxo de pacote
- **WHEN** uma pessoa ativar “Agendamento de Pacotes”
- **THEN** a aplicação MUST abrir a entrada de seleção e contratação de pacote sem criar agendamento, navegar para recurso externo ou alterar o fluxo manual antes da prévia e confirmação

#### Scenario: Ações do topbar em viewport estreita
- **WHEN** o topbar for renderizado em uma viewport estreita
- **THEN** seus controles MUST permanecer utilizáveis, com agrupamento, adaptação ou ocultação responsiva acessível que não crie rolagem horizontal nem cubra o conteúdo principal

