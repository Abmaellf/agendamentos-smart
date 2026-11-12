# Spec Delta

## MODIFIED Requirements

### Requirement: Cartões preservam o horário local e o estado retornado

Cada agendamento retornado MUST ser apresentado no dia calculado para seu fuso, na posição correspondente ao seu horário local e duração, com paciente, serviço e estado visual correspondente. Para atendimentos em grupo aceitos, cada paciente MUST manter um cartão separado no mesmo intervalo, lado a lado, sem ocultar informações de nenhum participante.

#### Scenario: Agendamento retornado no fuso da unidade

- **WHEN** a API retornar um instante e fuso associados ao agendamento
- **THEN** o cartão MUST aparecer na coluna do dia e no horário local calculado para aquele fuso

#### Scenario: Duração ocupa a matriz horária

- **WHEN** a API retornar um agendamento com horário inicial e duração em minutos
- **THEN** o cartão MUST iniciar no horário local correspondente, ocupar visualmente a faixa da duração e permanecer identificável mesmo quando ultrapassar uma linha horária

#### Scenario: Agendamentos simultâneos

- **WHEN** dois ou mais agendamentos do mesmo dia tiverem intervalos de horário sobrepostos
- **THEN** a agenda MUST renderizar os cards lado a lado à direita dentro da mesma faixa temporal, sem esconder paciente, serviço ou estado de nenhum deles

#### Scenario: Pacientes simultâneos em atendimento de grupo

- **WHEN** a API retornar dois ou mais agendamentos aceitos de pacientes distintos com intervalos sobrepostos no mesmo dia
- **THEN** a agenda MUST renderizar um cartão separado por paciente, lado a lado dentro da mesma faixa temporal, sem esconder nome, serviço ou estado de nenhum deles

#### Scenario: Paleta visual definida por estado

- **WHEN** a agenda renderizar um cartão em qualquer um dos seis estados canônicos
- **THEN** `AGENDADO` e `REAGENDADO` MUST usar amarelo com texto preto, `EMATENDIMENTO` e `FINALIZADO` MUST usar verde com texto branco, `CANCELADO` MUST usar grafite com texto branco e `FALTA` MUST usar vermelho com texto branco

#### Scenario: Cartão completo de agendamento

- **WHEN** a agenda renderizar um agendamento retornado pela API
- **THEN** o cartão MUST apresentar de forma legível o nome do paciente e o nome do serviço dentro da faixa temporal, e MUST manter o horário local, a duração e o estado identificáveis para pessoas que usam tecnologia assistiva

#### Scenario: Contraste e leitura do cartão

- **WHEN** um cartão for exibido em uma coluna diária, em uma faixa estreita de sobreposição ou em uma viewport estreita
- **THEN** suas informações MUST permanecer legíveis sem truncar o nome do paciente ou o serviço de forma que impeça sua identificação, e a cor MUST continuar acompanhada do estado textual acessível

### Requirement: Criação envia contrato mínimo e atualiza a agenda

A criação MUST enviar um agendamento por paciente, com paciente, unidade, serviço, profissional opcional, instante ISO, duração e preço, sem `tenantId`, estado, autoria ou data de criação. A interface MUST permitir o envio para um intervalo já ocupado por outro paciente e usar a resposta da API como autoridade para capacidade e conflitos. Após sucesso, MUST fechar o diálogo e invalidar a agenda.

#### Scenario: Criação bem-sucedida

- **WHEN** a API aceitar um agendamento válido
- **THEN** a interface MUST confirmar o sucesso, limpar/fechar o diálogo e refazer a consulta da agenda

#### Scenario: Conflito ou falha de criação

- **WHEN** a API recusar a criação ou ocorrer falha de rede
- **THEN** o diálogo MUST permanecer aberto e apresentar orientação associada ao erro quando disponível

#### Scenario: Criação bem-sucedida em horário já ocupado

- **WHEN** a pessoa criar para um paciente distinto um agendamento com intervalo sobreposto e a API confirmar capacidade disponível
- **THEN** a interface MUST confirmar o sucesso, limpar/fechar o diálogo, refazer a consulta da agenda e apresentar o novo paciente como cartão separado no mesmo intervalo

#### Scenario: Conflito ou capacidade esgotada

- **WHEN** a API recusar a criação por conflito de paciente, conflito de profissional, capacidade esgotada ou falha de rede
- **THEN** o diálogo MUST permanecer aberto e apresentar orientação associada ao erro quando disponível, sem informar que o agendamento foi criado

#### Scenario: Cada paciente ocupa uma vaga própria

- **WHEN** a pessoa registrar pacientes diferentes para o mesmo serviço e intervalo
- **THEN** a interface MUST enviar uma criação independente para cada paciente e MUST manter a decisão de aceitação ou rejeição da vaga com a API
