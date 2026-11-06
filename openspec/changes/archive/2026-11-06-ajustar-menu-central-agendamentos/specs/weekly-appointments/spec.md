# Spec Delta

## ADDED Requirements

### Requirement: O cabeçalho da agenda comunica a identidade e o contexto da tela

A página de agendamentos MUST apresentar um cabeçalho claro com ícone de calendário em bloco verde arredondado, título “Agendamentos” e subtítulo “Visualize e gerencie os atendimentos da semana.”.

#### Scenario: Exibição do cabeçalho conforme a referência

- **WHEN** a pessoa acessar a rota de agendamentos
- **THEN** a interface MUST exibir o ícone de calendário, o título e o subtítulo no cabeçalho da agenda, mantendo o conteúdo semanal abaixo dele

### Requirement: O menu central identifica a visualização semanal ativa

O cabeçalho MUST apresentar um seletor segmentado com ícones e os rótulos “Semana”, “Dia” e “Lista”, destacando “Semana” com o estado ativo e mantendo as demais opções visualmente neutras.

#### Scenario: Semana é a opção ativa

- **WHEN** a agenda semanal for renderizada
- **THEN** “Semana” MUST ter indicação visual e programática de opção ativa, enquanto “Dia” e “Lista” MUST permanecer visíveis como opções de visualização ainda não implementadas

#### Scenario: Opções futuras não alteram a agenda entregue

- **WHEN** a pessoa interagir com “Dia” ou “Lista” enquanto os modos correspondentes não estiverem implementados
- **THEN** a interface MUST manter a agenda semanal, a rota atual e os dados consultados, sem iniciar chamada HTTP ou operação de domínio nova

### Requirement: O cabeçalho da agenda permanece utilizável em telas estreitas

O cabeçalho MUST preservar a leitura, a identificação dos controles e a interação sem criar rolagem horizontal nem sobrepor o conteúdo em viewport estreita.

#### Scenario: Cabeçalho em viewport estreita

- **WHEN** a página de agendamentos for exibida em uma tela estreita
- **THEN** o ícone, o título, o subtítulo e o seletor MUST permanecer acessíveis por agrupamento ou reorganização responsiva, sem perda da indicação de “Semana” ativa
