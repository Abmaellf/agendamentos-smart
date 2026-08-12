# Requisitos do MVP

## Controle do documento

Este documento consolida as decisões obtidas na entrevista de produto encerrada em 12 de agosto de 2026. Ele descreve o comportamento esperado, não o estado já implementado. Para o estado executável do commit `62ac47e`, consulte [Objetivo do sistema](Objetivo%20do%20sistema.md) e [Arquitetura do Sistema](Arquitetura%20do%20Sistema.md).

Quando houver diferença entre o protótipo atual e este documento, o código deve continuar descrito como **estado atual**, e estas regras como **requisito confirmado do MVP**.

## Produto e público

O produto é um SaaS de agendamentos para fisioterapia, Pilates e atividades relacionadas. O contratante pode ser pessoa física ou jurídica:

- pessoa física representa o profissional ou negócio autônomo e possui uma única unidade;
- pessoa jurídica terá suporte futuro a várias unidades;
- o primeiro cadastro cria a clínica, a unidade inicial e o usuário administrador;
- a conta permanece bloqueada até a validação do e-mail.

No MVP, `tenantId` identifica a clínica/conta e é a fronteira de isolamento dos dados. O modelo também deve prever `unitId`, inicialmente apontando para a unidade padrão. A operação de múltiplas unidades para CNPJ será entregue depois e as novas unidades serão criadas pelo usuário master da plataforma.

## Perfis e permissões

Existem, no escopo da clínica, os perfis `ADMIN` e `BASIC`. O usuário master da plataforma não é um perfil operacional da clínica.

| Operação                                            | Administrador | Básico |
| --------------------------------------------------- | ------------: | -----: |
| Consultar agenda e cadastros permitidos             |           Sim |    Sim |
| Cadastrar pacientes e profissionais                 |           Sim |    Sim |
| Criar, confirmar, iniciar e concluir agendamento    |           Sim |    Sim |
| Remarcar agendamento                                |           Sim |    Sim |
| Cancelar agendamento, informando motivo             |           Sim |    Não |
| Excluir agendamento                                 |           Não |    Não |
| Criar usuário básico                                |           Sim |    Sim |
| Criar ou promover administrador                     |           Sim |    Não |
| Sobrescrever duração ou preço padrão no agendamento |           Sim |    Não |
| Administrar configurações restritas da clínica      |           Sim |    Não |

Permissões exibidas na interface devem ser novamente validadas pela API real. Ocultar ou desabilitar um botão não constitui controle de autorização.

O administrador define a senha inicial dos usuários criados. Essa senha é temporária e deve ser trocada obrigatoriamente no primeiro acesso. O MVP não terá recuperação de senha por e-mail; somente o administrador poderá redefini-la.

## Cadastros do MVP

### Paciente

Dados obrigatórios confirmados: nome, CPF e telefone. O MVP não inclui prontuário, diagnóstico, evolução clínica nem documentos médicos.

### Profissional

Dados confirmados: nome, CPF, CREFITO, telefone, especialidades, serviços executados e dias da semana disponíveis. Não serão configuradas faixas de horário, intervalos, férias, salas ou equipamentos no MVP.

Profissional e usuário são entidades diferentes. Um profissional pode não acessar o sistema; quando acessar, seu cadastro poderá ser vinculado a um usuário. Pacientes e profissionais serão compartilhados entre as futuras unidades do mesmo `tenant`.

### Serviço

Cada serviço define nome, duração, preço padrão e capacidade. A capacidade pertence ao serviço e deve estar entre 1 e 10. Um usuário básico usa duração e preço padrão; somente o administrador pode sobrescrevê-los para um agendamento específico.

## Agendamento

Cada agendamento representa um único paciente, inclusive quando várias pessoas participam de uma turma no mesmo serviço e horário. Os campos obrigatórios são:

- paciente;
- unidade;
- serviço/modalidade;
- data e horário;
- duração;
- profissional, que pode ser atribuído depois da criação.

O profissional torna-se obrigatório antes de mudar o atendimento para `EM_ATENDIMENTO` ou `CONCLUIDO`.

### Capacidade e conflitos

Para formar uma turma, são criados agendamentos separados para cada paciente com o mesmo serviço e horário. A soma não pode ultrapassar a capacidade do serviço.

O sistema deve bloquear, para todos os perfis e sem exceção administrativa:

- sobreposição de horários do mesmo paciente;
- sobreposição de horários do mesmo profissional;
- ocupação acima da capacidade do serviço.

A sobreposição considera o horário inicial e a duração do agendamento. Como o MVP registra apenas dias disponíveis do profissional, não existe bloqueio por jornada ou intervalo intradiário.

### Estados e transições do primeiro MVP

Estados canônicos: `AGENDADO`, `CONFIRMADO`, `EM_ATENDIMENTO`, `CONCLUIDO`, `CANCELADO`, `FALTA` e `REMARCADO`.

No primeiro MVP, confirmação, início, conclusão e registro de falta são ações manuais. As transições mínimas são:

| Origem           | Destinos permitidos                                                              |
| ---------------- | -------------------------------------------------------------------------------- |
| `AGENDADO`       | `CONFIRMADO`, `EM_ATENDIMENTO`, `CANCELADO`, `FALTA` ou `REMARCADO`              |
| `CONFIRMADO`     | `EM_ATENDIMENTO`, `CANCELADO`, `FALTA` ou `REMARCADO`                            |
| `EM_ATENDIMENTO` | `CONCLUIDO`                                                                      |
| estados finais   | `CONCLUIDO`, `CANCELADO`, `FALTA` e `REMARCADO` não recebem nova transição comum |

Uma transição deve registrar autor e instante. Cancelamento também exige motivo.

### Recorrência, remarcação e cancelamento

- um agendamento pode gerar uma série recorrente;
- cada ocorrência é um agendamento independente vinculado à série;
- remarcar altera somente a ocorrência escolhida;
- ao remarcar, a ocorrência original passa a `REMARCADO` e um novo agendamento é criado com referência ao original;
- administrador e usuário básico podem remarcar;
- em uma série recorrente, o cancelamento pode atingir a ocorrência escolhida e as próximas;
- somente o administrador pode cancelar e deve informar o motivo;
- nenhum perfil pode excluir definitivamente um agendamento.

## Entidades e contratos mínimos

O mock e a API futura devem trabalhar, no mínimo, com os conceitos `Tenant`, `Unit`, `User`, `Patient`, `Professional`, `Service`, `Appointment`, `AppointmentSeries` e `AppointmentEvent`.

Todos os dados pertencentes à clínica devem carregar `tenantId`. Dados operacionais por unidade também carregam `unitId`. Registros mutáveis devem possuir datas de criação/alteração e autoria quando aplicável. O frontend não deve receber ou armazenar senhas em respostas de perfil.

O agendamento deve preservar duração e preço usados no momento da criação; mudanças posteriores no serviço não podem reescrever seu histórico.

## Estratégia de mock

A API real está em outro repositório. Durante o MVP, os dados serão simulados, mas as telas não devem acessar `data.json` ou Axios diretamente. O mock deve ser consumido por funções de API tipadas, com os mesmos formatos pretendidos para o backend, permitindo trocar o adaptador sem reescrever páginas.

O mock deve simular ao menos:

- sessão, validação de e-mail e troca obrigatória da senha inicial;
- isolamento por `tenantId` e vínculo à unidade padrão;
- permissões por perfil;
- cadastros de usuários, pacientes, profissionais e serviços;
- criação, recorrência, conflito, capacidade e transições de agendamento;
- histórico de remarcação e cancelamento.

## Fora do primeiro MVP

- confirmação automática quatro horas antes do atendimento;
- marcação automática de `FALTA` ao terminar a duração sem início manual;
- conclusão automática ao terminar a duração de um atendimento iniciado;
- operação efetiva de múltiplas unidades para CNPJ;
- recuperação de senha por e-mail;
- pagamentos, pacotes de sessões e controle financeiro;
- prontuário, diagnóstico, evolução ou documentos clínicos;
- controle de salas, equipamentos, intervalos e férias;
- notificações por e-mail, WhatsApp ou SMS;
- exclusão definitiva de agendamentos.

## Critério transversal de conclusão

Uma funcionalidade do MVP só pode ser declarada implementada quando possuir estados de carregamento, erro, vazio e sucesso quando aplicáveis; validação de perfil; isolamento por `tenantId`; contrato tipado; feedback de operação; e testes proporcionais às regras de negócio.
