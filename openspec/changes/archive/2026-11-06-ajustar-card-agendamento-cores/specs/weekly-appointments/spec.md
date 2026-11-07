# Spec Delta

## MODIFIED Requirements

### Requirement: Cartões preservam o horário local e o estado retornado

Cada agendamento retornado MUST ser apresentado no dia calculado para seu fuso, em ordem de horário, com horário local, paciente, serviço e estado visual correspondente. O cartão MUST usar a paleta da referência: amarelo `#FFCF2E` para `AGENDADO` e `REAGENDADO`, verde `#069B6D` para `EMATENDIMENTO` e `FINALIZADO`, grafite `#2F3032` para `CANCELADO` e vermelho `#F51F3D` para `FALTA`; o texto MUST ser preto no amarelo e branco nas demais famílias.

#### Scenario: Agendamento retornado no fuso da unidade

- **WHEN** a API retornar um instante e fuso associados ao agendamento
- **THEN** o cartão MUST aparecer no dia e horário locais calculados para aquele fuso

#### Scenario: Cartão completo de agendamento

- **WHEN** a agenda renderizar um agendamento retornado pela API
- **THEN** o cartão MUST apresentar de forma legível o horário local, o nome do paciente e o nome do serviço, e MUST manter o estado identificável para pessoas que usam tecnologia assistiva

#### Scenario: Paleta visual definida por estado

- **WHEN** a agenda renderizar um cartão em qualquer um dos seis estados canônicos
- **THEN** `AGENDADO` e `REAGENDADO` MUST usar amarelo com texto preto, `EMATENDIMENTO` e `FINALIZADO` MUST usar verde com texto branco, `CANCELADO` MUST usar grafite com texto branco e `FALTA` MUST usar vermelho com texto branco

#### Scenario: Contraste e leitura do cartão

- **WHEN** um cartão for exibido em uma coluna diária ou em uma viewport estreita
- **THEN** suas informações MUST permanecer legíveis sem truncar o nome do paciente ou o serviço de forma que impeça sua identificação, e a cor MUST continuar acompanhada do estado textual acessível
