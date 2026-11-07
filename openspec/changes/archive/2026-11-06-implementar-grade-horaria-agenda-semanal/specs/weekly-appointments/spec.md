# Spec Delta

## MODIFIED Requirements

### Requirement: A agenda consulta e apresenta uma semana útil

A agenda MUST consultar os agendamentos da unidade ativa para o intervalo semanal selecionado e apresentar cinco colunas úteis, de segunda a sexta-feira, em uma matriz horária com régua lateral iniciando às 07:00 e linhas de uma hora até 18:00 na faixa padrão visível. A agenda MUST oferecer estados de carregamento, erro com nova tentativa, vazio e dados.

#### Scenario: Semana sem agendamentos

- **WHEN** a consulta da semana retornar uma lista vazia
- **THEN** a agenda MUST informar que não existem agendamentos na semana selecionada

#### Scenario: Mudança de semana

- **WHEN** a pessoa selecionar outra data ou usar a navegação semanal
- **THEN** a agenda MUST consultar e destacar a semana correspondente

#### Scenario: Grade horária semanal

- **WHEN** a agenda renderizar uma semana com dados
- **THEN** MUST exibir uma régua lateral com `07:00`, `08:00` e cada hora subsequente até `18:00`, e MUST fazer cada linha atravessar visualmente as cinco colunas de segunda a sexta-feira

### Requirement: Cartões preservam o horário local e o estado retornado

Cada agendamento retornado MUST ser apresentado no dia calculado para seu fuso, na posição correspondente ao seu horário local e duração, com paciente, serviço e estado visual correspondente. Cards com intervalos simultâneos MUST compartilhar a mesma linha temporal lado a lado, mantendo um card separado por paciente.

#### Scenario: Agendamento retornado no fuso da unidade

- **WHEN** a API retornar um instante e fuso associados ao agendamento
- **THEN** o cartão MUST aparecer na coluna do dia e no horário local calculado para aquele fuso

#### Scenario: Duração ocupa a matriz horária

- **WHEN** a API retornar um agendamento com horário inicial e duração em minutos
- **THEN** o cartão MUST iniciar no horário local correspondente, ocupar visualmente a faixa da duração e permanecer identificável mesmo quando ultrapassar uma linha horária

#### Scenario: Agendamentos simultâneos

- **WHEN** dois ou mais agendamentos do mesmo dia tiverem intervalos de horário sobrepostos
- **THEN** a agenda MUST renderizar os cards lado a lado à direita dentro da mesma faixa temporal, sem esconder paciente, serviço ou estado de nenhum deles

#### Scenario: Paleta visual definida por estado

- **WHEN** a agenda renderizar um cartão em qualquer um dos seis estados canônicos
- **THEN** `AGENDADO` e `REAGENDADO` MUST usar amarelo com texto preto, `EMATENDIMENTO` e `FINALIZADO` MUST usar verde com texto branco, `CANCELADO` MUST usar grafite com texto branco e `FALTA` MUST usar vermelho com texto branco

#### Scenario: Cartão completo de agendamento

- **WHEN** a agenda renderizar um agendamento retornado pela API
- **THEN** o cartão MUST apresentar de forma legível o nome do paciente e o nome do serviço dentro da faixa temporal, e MUST manter o horário local, a duração e o estado identificáveis para pessoas que usam tecnologia assistiva

#### Scenario: Contraste e leitura do cartão

- **WHEN** um cartão for exibido em uma coluna diária, em uma faixa estreita de sobreposição ou em uma viewport estreita
- **THEN** suas informações MUST permanecer legíveis sem truncar o nome do paciente ou o serviço de forma que impeça sua identificação, e a cor MUST continuar acompanhada do estado textual acessível

## ADDED Requirements

### Requirement: O cabeçalho das colunas comunica o dia e a data

Cada coluna da semana MUST exibir no topo o nome do dia da semana em português, a data no formato “24 de Agosto” e um indicador visual de calendário. O dia selecionado MUST ter destaque visual próprio e indicar “Hoje” quando corresponder à data atual.

#### Scenario: Colunas de segunda a sexta

- **WHEN** a agenda semanal for renderizada
- **THEN** MUST exibir as colunas na ordem `Segunda`, `Terça`, `Quarta`, `Quinta` e `Sexta`, cada uma com seu dia e data correspondentes

#### Scenario: Dia atual destacado

- **WHEN** uma das colunas corresponder à data atual
- **THEN** essa coluna MUST apresentar destaque visual e o indicador textual “Hoje” sem alterar os dados consultados

### Requirement: A legenda explica as cores dos estados da agenda

A agenda MUST apresentar uma legenda inferior com quatro grupos de cor, rótulo e descrição: amarelo “Aguardando atendimento” / “Paciente agendado”; verde “Atendida” / “Atendimento realizado”; grafite “Cancelado” / “Agendamento cancelado”; vermelho “Falta” / “Paciente não compareceu”. A informação textual MUST permanecer disponível sem depender somente da cor.

#### Scenario: Legenda da referência visual

- **WHEN** a agenda renderizar a matriz horária
- **THEN** MUST exibir os quatro grupos da legenda com seus rótulos e descrições correspondentes às cores dos cartões

#### Scenario: Acessibilidade da legenda

- **WHEN** uma pessoa navegar pela legenda usando tecnologia assistiva
- **THEN** cada grupo MUST ser anunciado com seu estado e sua descrição, independentemente da percepção da cor

### Requirement: A matriz permanece utilizável em telas estreitas

Em uma viewport estreita, a agenda MUST preservar a régua de horários, a identificação dos dias e a leitura dos cards, podendo permitir rolagem horizontal controlada para as cinco colunas sem sobreposição indevida do cabeçalho ou da legenda.

#### Scenario: Grade em viewport estreita

- **WHEN** a agenda for exibida em uma tela estreita
- **THEN** a régua, os cabeçalhos de dia/data, os cards e a legenda MUST continuar acessíveis e identificáveis, mesmo que a matriz exija rolagem horizontal
