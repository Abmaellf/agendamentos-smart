# Feature Specification: Criar agendamento manual

**Feature Branch**: `001-criar-agendamento-manual`  
**Created**: 2026-08-12  
**Status**: Implemented
**Input**: User description: "Permitir que usuários ADMIN e BASIC criem manualmente um agendamento para um paciente, unidade, serviço, data e horário, usando duração e preço padrão do serviço, com profissional opcional na criação. O sistema deve impedir conflitos de paciente ou profissional e excesso de capacidade; somente ADMIN pode sobrescrever duração ou preço padrão."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Registrar atendimento na agenda (Priority: P1)

Como usuário autenticado da clínica, quero registrar manualmente um atendimento para um paciente em uma unidade, serviço, data e horário, para que o compromisso passe a fazer parte da agenda operacional.

**Why this priority**: Criar um agendamento válido é o menor resultado que entrega valor à agenda; recorrência, remarcação e demais transições dependem da existência desse registro inicial.

**Independent Test**: Selecionar cadastros válidos em um horário livre, concluir a criação e verificar um único agendamento `AGENDADO` na agenda, com duração e preço preservados. Isso entrega o registro manual do compromisso mesmo sem profissional atribuído e sem os fluxos posteriores.

#### Acceptance Scenarios:

1. **Given** um usuário `ADMIN` ou `BASIC` autenticado e paciente, unidade e serviço pertencentes ao mesmo tenant, **When** ele informa uma data e horário livres e confirma a criação, **Then** um único agendamento é criado no estado `AGENDADO` e apresentado na agenda com os valores usados na criação.
2. **Given** um serviço com duração e preço padrão e nenhum profissional selecionado, **When** o usuário cria o agendamento em um horário válido, **Then** o agendamento usa os padrões do serviço e permanece válido para receber um profissional posteriormente.
3. **Given** que um campo obrigatório não foi informado, **When** o usuário tenta criar o agendamento, **Then** nenhum registro é criado e os campos pendentes são identificados para correção.

---

### User Story 2 - Impedir conflitos e excesso de capacidade (Priority: P2)

Como usuário da clínica, quero ser impedido de criar compromissos incompatíveis, para que um paciente ou profissional não ocupe dois atendimentos sobrepostos e uma turma não ultrapasse a capacidade contratada para o serviço.

**Why this priority**: Depois da criação básica, proteger a consistência da agenda evita dupla ocupação e vagas prometidas além da capacidade, riscos que afetam diretamente a operação e o atendimento.

**Independent Test**: Preparar separadamente um conflito de paciente, um conflito de profissional e um horário com capacidade esgotada; tentar criar um novo agendamento em cada condição e verificar que todos são recusados sem alterar a agenda.

#### Acceptance Scenarios:

1. **Given** um paciente com agendamento que se sobrepõe ao intervalo solicitado, **When** qualquer usuário tenta criar o novo agendamento, **Then** a criação é bloqueada, o conflito de paciente é informado e a agenda permanece inalterada.
2. **Given** um profissional atribuído a outro agendamento que se sobrepõe ao intervalo solicitado, **When** qualquer usuário tenta criar o novo agendamento com esse profissional, **Then** a criação é bloqueada, o conflito de profissional é informado e a agenda permanece inalterada.
3. **Given** que a capacidade do serviço já foi atingida no horário solicitado, **When** qualquer usuário tenta incluir outro paciente no mesmo serviço e horário, **Then** a criação é bloqueada por capacidade e nenhum agendamento adicional é registrado.
4. **Given** duas tentativas simultâneas para a última vaga de um serviço, **When** ambas são confirmadas, **Then** somente uma criação é aceita e a ocupação final não ultrapassa a capacidade.

---

### User Story 3 - Respeitar padrões e permissões de alteração (Priority: P3)

Como administrador, quero ajustar duração ou preço para uma situação específica, enquanto usuários básicos permanecem vinculados aos padrões do serviço, para permitir exceções controladas sem perder a regra comercial da clínica.

**Why this priority**: A agenda já entrega valor usando os padrões; a sobrescrita administrativa atende exceções e pode ser validada de forma isolada depois do fluxo essencial e das proteções de consistência.

**Independent Test**: Em um horário livre, criar um agendamento como `ADMIN` com duração e preço diferentes dos padrões e outro como `BASIC`; verificar que a exceção administrativa é preservada e que o usuário básico só consegue salvar os valores padrão.

#### Acceptance Scenarios:

1. **Given** um administrador criando um agendamento válido, **When** ele informa duração ou preço diferentes dos padrões do serviço, **Then** o agendamento é criado com os valores informados e esses valores ficam preservados no histórico do compromisso.
2. **Given** um usuário básico criando um agendamento válido, **When** ele tenta alterar duração ou preço, **Then** a alteração não é aceita e o agendamento somente pode ser criado com os padrões vigentes do serviço.

## Edge Cases

- Quando o término de um agendamento coincide exatamente com o início do seguinte, os intervalos são considerados adjacentes e a criação é permitida, conforme a premissa de intervalos semiabertos.
- Quando a capacidade do serviço é `1`, o primeiro agendamento válido ocupa a vaga e toda tentativa sobreposta posterior para o mesmo serviço é bloqueada.
- Quando o mesmo paciente tenta ocupar uma turma na qual já possui agendamento sobreposto, o conflito de paciente prevalece mesmo que ainda exista capacidade.
- Quando nenhum profissional é atribuído, a validação de conflito de profissional não se aplica, mas as validações de paciente e capacidade continuam obrigatórias.
- Quando um cadastro selecionado não pertence ao tenant da sessão, a criação é recusada sem revelar dados da outra clínica.
- Quando duas solicitações disputam a última vaga, a capacidade deve ser verificada no momento da confirmação e nunca terminar acima do limite.
- Datas passadas são bloqueadas para todos os papéis; o instante usa o fuso IANA da unidade; profissional fora dos dias disponíveis bloqueia a criação.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema DEVE permitir que usuários autenticados com perfil `ADMIN` ou `BASIC` iniciem a criação manual de um agendamento.
- **FR-002**: O sistema DEVE exigir paciente, unidade, serviço, data, horário e duração antes de concluir a criação.
- **FR-003**: O sistema DEVE permitir que o profissional seja atribuído depois da criação do agendamento.
- **FR-004**: O sistema DEVE preencher inicialmente duração e preço com os valores padrão vigentes do serviço selecionado.
- **FR-005**: O sistema DEVE representar cada agendamento como o compromisso de um único paciente, inclusive em serviços com capacidade maior que `1`.
- **FR-006**: O sistema DEVE criar um agendamento manual válido no estado inicial `AGENDADO`.
- **FR-007**: O sistema DEVE preservar no agendamento a duração e o preço usados na criação, sem reescrevê-los quando o serviço for alterado posteriormente.
- **FR-008**: O sistema DEVE restringir paciente, profissional, serviço e unidade aos dados pertencentes ao `tenantId` da sessão e registrar o `unitId` selecionado.
- **FR-009**: O sistema DEVE bloquear qualquer sobreposição de horário do mesmo paciente, considerando horário inicial e duração.
- **FR-010**: O sistema DEVE bloquear qualquer sobreposição de horário do mesmo profissional quando um profissional estiver atribuído.
- **FR-011**: O sistema DEVE bloquear uma criação que faça a ocupação do serviço e horário ultrapassar a capacidade configurada, entre `1` e `10` pacientes.
- **FR-012**: O sistema DEVE aplicar os bloqueios de paciente, profissional e capacidade a todos os perfis, sem exceção administrativa.
- **FR-013**: O sistema DEVE permitir que somente o perfil `ADMIN` sobrescreva a duração ou o preço padrão em um agendamento específico.
- **FR-014**: O sistema DEVE impedir que o perfil `BASIC` persista duração ou preço diferentes dos padrões do serviço.
- **FR-015**: O sistema DEVE registrar o autor e o instante de criação do agendamento.
- **FR-016**: O sistema DEVE indicar que a criação está em andamento e impedir confirmações duplicadas enquanto a mesma operação estiver pendente.
- **FR-017**: O sistema DEVE confirmar o sucesso e tornar o novo agendamento visível na agenda após a criação.
- **FR-018**: O sistema DEVE informar a causa de uma recusa ou falha e preservar os dados válidos já informados para uma nova tentativa.
- **FR-019**: O sistema DEVE bloquear solicitações para datas ou horários passados para `ADMIN` e `BASIC`.
- **FR-020**: O sistema DEVE interpretar data e horário pelo identificador IANA da unidade, persistir o instante normalizado e devolver também o fuso usado.
- **FR-021**: O sistema DEVE bloquear a criação quando o profissional selecionado estiver fora dos dias disponíveis.

### Key Entities _(include if feature involves data)_

- **Appointment**: Compromisso individual de um paciente; relaciona tenant, unidade, paciente, serviço e profissional opcional, e preserva início, duração, preço, estado, autor e instante de criação.
- **Patient**: Pessoa atendida e titular único do agendamento; pertence ao tenant e não pode possuir intervalos sobrepostos.
- **Professional**: Prestador opcional na criação; pertence ao tenant, executa serviços e não pode ocupar intervalos sobrepostos quando atribuído.
- **Service**: Modalidade oferecida pela clínica; define duração, preço padrão e capacidade entre `1` e `10`.
- **Unit**: Local operacional no qual o agendamento ocorre; pertence ao tenant e identifica o contexto de agenda.
- **User**: Operador autenticado que cria o agendamento; seu perfil determina se duração e preço podem ser sobrescritos.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Em teste de usabilidade, pelo menos `90%` dos usuários representativos concluem um agendamento válido em até `2 minutos`, sem ajuda e na primeira tentativa.
- **SC-002**: Em `100%` dos cenários de teste com sobreposição de paciente ou profissional, nenhum agendamento conflitante é criado.
- **SC-003**: Em `100%` dos cenários de capacidade, inclusive duas tentativas simultâneas para a última vaga, a ocupação final permanece menor ou igual ao limite do serviço.
- **SC-004**: Em `100%` das tentativas com referências de outro tenant, a criação é recusada sem expor dados da clínica não autorizada.
- **SC-005**: Em `100%` dos agendamentos criados, mudanças posteriores no serviço mantêm inalteradas a duração e o preço registrados no compromisso.
- **SC-006**: Em `100%` dos testes de perfil, `ADMIN` consegue salvar uma exceção válida e `BASIC` não consegue persistir duração ou preço fora do padrão.

## Assumptions

- Pacientes, profissionais, serviços e a unidade padrão são cadastrados por features próprias e estão disponíveis antes da criação do agendamento.
- A duração e o preço padrão do serviço são válidos no momento da seleção; definir e manter esses padrões pertence ao cadastro de serviços.
- Intervalos de agendamento são semiabertos: incluem o instante inicial e excluem o instante final, permitindo compromissos adjacentes sem sobreposição.
- Recorrência, remarcação, cancelamento, confirmação, início, conclusão e registro de falta estão fora do escopo desta feature.
- A API real ou o adaptador de mock aplica novamente autorização, isolamento por tenant, conflitos e capacidade; controles visuais não são considerados proteção suficiente.
- O profissional pode permanecer ausente enquanto o agendamento estiver `AGENDADO`, mas deverá ser atribuído antes de uma futura transição para `EM_ATENDIMENTO` ou `CONCLUIDO`.
