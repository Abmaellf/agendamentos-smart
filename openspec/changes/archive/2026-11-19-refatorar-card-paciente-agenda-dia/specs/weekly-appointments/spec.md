# Spec Delta

## MODIFIED Requirements

### Requirement: Cartões preservam o horário local e o estado retornado

Cada agendamento retornado MUST ser apresentado no dia calculado para seu fuso, na posição correspondente ao seu horário local e duração, com paciente, serviço e estado visual correspondente. Cards com intervalos simultâneos MUST compartilhar a mesma faixa temporal e ser distribuídos em linhas ou colunas visíveis, mantendo um card separado por paciente.

#### Scenario: Agendamento retornado no fuso da unidade

- **WHEN** a API retornar um instante e fuso associados ao agendamento
- **THEN** o cartão MUST aparecer na coluna do dia e no horário local calculado para aquele fuso

#### Scenario: Duração ocupa a matriz horária

- **WHEN** a API retornar um agendamento com horário inicial e duração em minutos
- **THEN** o cartão MUST iniciar no horário local correspondente, ocupar visualmente a faixa da duração e permanecer identificável mesmo quando ultrapassar uma linha horária

#### Scenario: Agendamentos simultâneos

- **WHEN** dois ou mais agendamentos do mesmo dia tiverem intervalos de horário sobrepostos
- **THEN** a agenda MUST renderizar um card separado por paciente, preservando a ordem estável dos registros e distribuindo-os sem sobreposição indevida na faixa temporal; quando a largura horizontal da coluna for atingida, os cards excedentes MUST continuar na linha inferior alinhados à esquerda

#### Scenario: Paleta visual definida por estado

- **WHEN** a agenda renderizar um cartão em qualquer um dos seis estados canônicos
- **THEN** `AGENDADO` e `REAGENDADO` MUST usar amarelo com texto preto, `EMATENDIMENTO` e `FINALIZADO` MUST usar verde com texto branco, `CANCELADO` MUST usar grafite com texto branco e `FALTA` MUST usar vermelho com texto branco

#### Scenario: Cartão completo de agendamento

- **WHEN** a agenda renderizar um agendamento retornado pela API
- **THEN** o cartão MUST apresentar de forma legível o primeiro nome do paciente e o nome do serviço dentro da faixa temporal, e MUST manter o horário local, a duração e o estado identificáveis para pessoas que usam tecnologia assistiva

#### Scenario: Contraste e leitura do cartão

- **WHEN** um cartão for exibido em uma coluna diária, em uma faixa estreita de sobreposição ou em uma viewport estreita
- **THEN** suas informações visíveis MUST permanecer legíveis sem barra de rolagem interna; o primeiro nome e o serviço podem ser quebrados ou truncados visualmente para caber no cartão, desde que a identificação completa do paciente, o serviço, o horário e o estado permaneçam disponíveis por nome acessível ou dica contextual

## ADDED Requirements

### Requirement: O cartão exibe apenas o primeiro nome do paciente

O conteúdo textual visível do cartão MUST exibir somente o primeiro nome do paciente, derivado do primeiro termo do nome completo após a remoção de espaços nas extremidades.

#### Scenario: Nome completo com vários termos

- **WHEN** o agendamento tiver um paciente chamado `Ana Carolina Oliveira`
- **THEN** o texto visível do paciente no cartão MUST ser `Ana`, enquanto o nome completo MUST permanecer disponível em uma descrição acessível ou dica contextual

#### Scenario: Nome com um único termo

- **WHEN** o agendamento tiver um paciente cujo nome contenha apenas um termo
- **THEN** o cartão MUST exibir esse termo sem alteração como nome visível

### Requirement: O cartão não cria rolagem interna

O cartão MUST ocultar ou acomodar qualquer conteúdo excedente sem apresentar barra de rolagem horizontal ou vertical própria.

#### Scenario: Conteúdo excede a largura do cartão

- **WHEN** o primeiro nome ou o serviço não couber na largura disponível
- **THEN** o texto MUST ser quebrado ou truncado dentro dos limites do cartão, sem criar rolagem interna e sem deslocar os demais cartões da coluna

### Requirement: Cartões simultâneos quebram para a esquerda quando a largura termina

Os cartões que ocuparem o mesmo intervalo visual MUST ser organizados da esquerda para a direita e, ao atingir a largura útil da coluna do dia, o próximo cartão MUST iniciar na linha imediatamente inferior, alinhado à esquerda.

#### Scenario: Mais cartões simultâneos que a primeira linha comporta

- **WHEN** quatro agendamentos simultâneos excederem a largura disponível para três cartões
- **THEN** os três primeiros MUST permanecer na primeira linha, o quarto MUST aparecer na linha seguinte iniciando no limite esquerdo da coluna e nenhum cartão MUST ser cortado por rolagem horizontal

#### Scenario: Quebra exige altura adicional

- **WHEN** a distribuição de cartões simultâneos gerar uma ou mais linhas adicionais
- **THEN** a área da agenda MUST crescer o suficiente para exibir todas as linhas, preservando o início e a duração de cada agendamento e evitando sobreposição com outra faixa temporal

### Requirement: A linha horária responde ao hover

Cada linha horária da matriz MUST oferecer um estado visual de hover que atravesse a régua de horários e as cinco colunas do dia, sem alterar os dados nem iniciar uma operação de domínio.

#### Scenario: Pessoa posiciona o cursor sobre uma linha

- **WHEN** a pessoa posicionar o cursor sobre qualquer célula da linha `07:00`
- **THEN** toda a linha `07:00`, incluindo seu rótulo na régua e a faixa correspondente nas cinco colunas, MUST receber o destaque visual definido pela agenda

#### Scenario: Pessoa deixa a linha horária

- **WHEN** o cursor sair da linha horária destacada
- **THEN** o destaque MUST ser removido sem fazer chamada HTTP, mudar o horário selecionado ou alterar a posição dos cartões
