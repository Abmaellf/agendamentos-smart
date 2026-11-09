# Spec Delta

## MODIFIED Requirements

### Requirement: A agenda consulta e apresenta uma semana útil

A agenda MUST consultar os agendamentos da unidade ativa para o intervalo semanal selecionado e interpretar a coleção retornada no envelope `content`. Cada item da coleção MUST preservar os dados de resposta necessários à agenda, incluindo identificadores, paciente, serviço, profissional opcional, instante, fuso, duração, preço, status e metadados de auditoria, sem exigir que campos somente de resposta sejam enviados na criação. A agenda MUST apresentar cinco colunas úteis, de segunda a sexta-feira, em uma matriz horária com régua lateral iniciando às 07:00 e linhas de uma hora até 18:00 na faixa padrão visível. A agenda MUST oferecer estados de carregamento, erro com nova tentativa, vazio e dados.

#### Scenario: Semana sem agendamentos

- **WHEN** a consulta da semana retornar `{ "content": [] }`
- **THEN** a agenda MUST informar que não existem agendamentos na semana selecionada

#### Scenario: Mudança de semana

- **WHEN** a pessoa selecionar outra data ou usar a navegação semanal
- **THEN** a agenda MUST consultar e destacar a semana correspondente

#### Scenario: Grade horária semanal

- **WHEN** a agenda renderizar uma semana com dados
- **THEN** MUST exibir uma régua lateral com `07:00`, `08:00` e cada hora subsequente até `18:00`, e MUST fazer cada linha atravessar visualmente as cinco colunas de segunda a sexta-feira

#### Scenario: Envelope de resposta do backend

- **WHEN** `GET /api/appointments` retornar um objeto com a propriedade `content` contendo agendamentos
- **THEN** a agenda MUST usar os itens de `content` como a coleção de agendamentos, sem exibir o envelope como dado de agendamento e sem descartar a resposta por ela não ser um array na raiz

### Requirement: Cartões preservam o horário local e o estado retornado

Cada agendamento retornado MUST ser apresentado no dia calculado para seu fuso, na posição correspondente ao seu horário local e duração, com paciente, serviço e estado visual correspondente. O cartão MUST tolerar profissional nulo e preservar os dados de identificação e auditoria retornados, incluindo `id`, `patient.id`, `patient.name`, `service.id`, `service.name`, `startsAt`, `timeZone`, `durationMinutes`, `price`, `status`, `createdBy`, `createdAt`, `patientId`, `pathology`, `appointmentDate`, `hours`, `variant` e `updatedAt`, quando presentes. Cards com intervalos simultâneos MUST compartilhar a mesma linha temporal lado a lado, mantendo um card separado por paciente.

#### Scenario: Agendamento retornado no fuso da unidade

- **WHEN** a API retornar um instante e fuso associados ao agendamento
- **THEN** o cartão MUST aparecer na coluna do dia e no horário local calculado para aquele fuso

#### Scenario: Duração ocupa a matriz horária

- **WHEN** a API retornar um agendamento com horário inicial e duração em minutos
- **THEN** o cartão MUST iniciar no horário local correspondente, ocupar visualmente a faixa da duração e permanecer identificável mesmo quando ultrapassar uma linha horária

#### Scenario: Agendamentos simultâneos

- **WHEN** dois ou mais agendamentos do mesmo dia tiverem intervalos de horário sobrepostos
- **THEN** a agenda MUST renderizar os cards lado a lado à direita dentro da mesma faixa temporal, sem esconder paciente, serviço ou estado de nenhum deles

#### Scenario: Profissional opcional e metadados de resposta

- **WHEN** a API retornar um agendamento com `professional: null`, `pathology: []`, preço numérico e os campos auxiliares `appointmentDate`, `hours`, `variant` e `updatedAt`
- **THEN** a agenda MUST renderizar o paciente, serviço, horário, duração, preço e status normalmente, sem falha de leitura, sem exigir profissional e sem converter esses campos de resposta em campos obrigatórios da criação

#### Scenario: Paleta visual definida por estado

- **WHEN** a agenda renderizar um cartão em qualquer um dos seis estados canônicos
- **THEN** `AGENDADO` e `REAGENDADO` MUST usar amarelo com texto preto, `EMATENDIMENTO` e `FINALIZADO` MUST usar verde com texto branco, `CANCELADO` MUST usar grafite com texto branco e `FALTA` MUST usar vermelho com texto branco

#### Scenario: Cartão completo de agendamento

- **WHEN** a agenda renderizar um agendamento retornado pela API
- **THEN** o cartão MUST apresentar de forma legível o nome do paciente e o nome do serviço dentro da faixa temporal, e MUST manter o horário local, a duração e o estado identificáveis para pessoas que usam tecnologia assistiva

#### Scenario: Contraste e leitura do cartão

- **WHEN** um cartão for exibido em uma coluna diária, em uma faixa estreita de sobreposição ou em uma viewport estreita
- **THEN** suas informações MUST permanecer legíveis sem truncar o nome do paciente ou o serviço de forma que impeça sua identificação, e a cor MUST continuar acompanhada do estado textual acessível
