# weekly-appointments Specification

## Purpose
Descreve a agenda semanal e a criação manual atualmente entregues, incluindo catálogo, validação de formulário, permissões visuais e atualização da consulta.

## Requirements

### Requirement: A agenda consulta e apresenta uma semana útil

A agenda MUST consultar os agendamentos da unidade ativa para o intervalo semanal selecionado, apresentar cinco dias úteis e oferecer estados de carregamento, erro com nova tentativa, vazio e dados.

#### Scenario: Semana sem agendamentos

- **WHEN** a consulta da semana retornar uma lista vazia
- **THEN** a agenda MUST informar que não existem agendamentos na semana selecionada

#### Scenario: Mudança de semana

- **WHEN** a pessoa selecionar outra data ou usar a navegação semanal
- **THEN** a agenda MUST consultar e destacar a semana correspondente

### Requirement: Cartões preservam o horário local e o estado retornado

Cada agendamento retornado MUST ser apresentado no dia calculado para seu fuso, em ordem de horário, com paciente, serviço e estado visual correspondente.

#### Scenario: Agendamento retornado no fuso da unidade

- **WHEN** a API retornar um instante e fuso associados ao agendamento
- **THEN** o cartão MUST aparecer no dia e horário locais calculados para aquele fuso

### Requirement: Criação manual carrega catálogos necessários

O diálogo de criação MUST carregar pacientes, unidades e serviços antes do envio e MUST buscar profissionais filtrados pelo serviço selecionado, mantendo o profissional opcional.

#### Scenario: Serviço selecionado

- **WHEN** a pessoa selecionar um serviço
- **THEN** o formulário MUST preencher duração e preço padrão e consultar os profissionais daquele serviço

### Requirement: Formulário valida os dados e limita sobrescritas pelo papel

O formulário MUST exigir paciente, unidade, serviço, data, horário, duração inteira entre 1 e 480 minutos e preço decimal com duas casas. `ADMIN` pode editar duração e preço; `BASIC` MUST enviar os valores padrão do serviço.

#### Scenario: Formulário incompleto

- **WHEN** a pessoa tentar criar o agendamento sem campos obrigatórios
- **THEN** a interface MUST apontar os campos inválidos e não enviar a chamada de criação

#### Scenario: Sessão BASIC

- **WHEN** uma pessoa com papel `BASIC` selecionar um serviço
- **THEN** duração e preço MUST permanecer somente leitura e o payload MUST usar seus valores padrão

### Requirement: Criação envia contrato mínimo e atualiza a agenda

A criação MUST enviar paciente, unidade, serviço, profissional opcional, instante ISO, duração e preço, sem `tenantId`, estado, autoria ou data de criação. Após sucesso, MUST fechar o diálogo e invalidar a agenda.

#### Scenario: Criação bem-sucedida

- **WHEN** a API aceitar um agendamento válido
- **THEN** a interface MUST confirmar o sucesso, limpar/fechar o diálogo e refazer a consulta da agenda

#### Scenario: Conflito ou falha de criação

- **WHEN** a API recusar a criação ou ocorrer falha de rede
- **THEN** o diálogo MUST permanecer aberto e apresentar orientação associada ao erro quando disponível

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
