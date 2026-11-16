# Spec Delta

## Purpose

Permite contratar um pacote para um paciente e gerar seus agendamentos
individuais pela agenda existente, mantendo as condições efetivas e as sessões
associadas de forma rastreável e imutável.

## ADDED Requirements

### Requirement: Pacotes elegíveis são consultados no escopo autorizado
O sistema MUST disponibilizar para nova contratação somente pacotes ativos da
clínica, unidade e serviço autorizados. Cada resultado MUST apresentar as
condições necessárias para escolha, incluindo serviço, total de sessões, dias
configurados, frequência derivada e valor total, sem expor dados de outra
clínica ou administrativos não necessários à contratação.

#### Scenario: Consulta de pacote ativo para uma unidade autorizada
- **WHEN** uma pessoa autorizada consultar pacotes para um serviço e unidade de seu escopo
- **THEN** o sistema MUST retornar somente os pacotes ativos compatíveis com esse serviço e unidade

#### Scenario: Pacote inativo ou externo à clínica
- **WHEN** uma pessoa solicitar um pacote inativo ou pertencente a outra clínica/unidade
- **THEN** o sistema MUST não o tornar elegível para uma nova contratação nem expor seus dados não autorizados

### Requirement: Contratação usa dias efetivos editáveis sem alterar o pacote
Ao selecionar um pacote, o sistema MUST iniciar os dias efetivos com os dias
configurados no pacote e permitir sua alteração para a contratação atual. Os
dias efetivos MUST conter de um a sete valores distintos; sua frequência MUST
ser derivada dessa seleção. A alteração MUST NOT modificar a definição
administrativa do pacote.

#### Scenario: Pessoa mantém os dias sugeridos
- **WHEN** uma pessoa seleciona um pacote e não altera seus dias semanais
- **THEN** a prévia MUST usar exatamente os dias configurados no pacote como dias efetivos da contratação

#### Scenario: Pessoa altera os dias para a contratação
- **WHEN** uma pessoa autorizada substituir segunda e quarta por terça e quinta antes da prévia
- **THEN** o sistema MUST calcular a contratação com terça e quinta, derivar a nova frequência e manter o pacote administrativo inalterado

#### Scenario: Tentativa de remover todos os dias
- **WHEN** uma pessoa tentar simular ou confirmar uma contratação sem dias efetivos
- **THEN** o sistema MUST rejeitar a operação sem criar contratação ou agendamento

### Requirement: Paciente, unidade e pacote são validados antes da prévia
O sistema MUST exigir um paciente existente, um pacote elegível e uma unidade
compatível com ambos e com a pessoa autenticada. A clínica e o escopo MUST ser
derivados da sessão no servidor. Um pacote só poderá ser contratado para um
paciente quando a unidade, o serviço e as regras de atendimento forem válidos.

#### Scenario: Paciente autorizado na unidade do pacote
- **WHEN** uma pessoa selecionar paciente e pacote compatíveis em sua unidade autorizada
- **THEN** o sistema MUST permitir a geração da prévia, sujeita às demais validações de calendário e disponibilidade

#### Scenario: Paciente ou pacote fora do escopo
- **WHEN** uma pessoa tentar usar paciente, unidade ou pacote de outra clínica ou fora da unidade permitida
- **THEN** o sistema MUST recusar a operação sem revelar o recurso externo ao escopo

### Requirement: Datas são calculadas até completar a quantidade contratada
A data inicial informada MUST ser interpretada como data mínima, no fuso da
unidade. O sistema MUST percorrer as datas em ordem cronológica e incluir
somente datas futuras que coincidam com os dias efetivos até alcançar exatamente
o total de sessões do pacote. Nesta capability, feriados, funcionamento da
unidade e bloqueios operacionais não são consultados; essa validação será
definida em uma especificação futura.

#### Scenario: Data mínima fora dos dias efetivos
- **WHEN** uma contratação com dias efetivos segunda e quarta receber terça-feira como data inicial
- **THEN** a primeira sessão MUST ser a próxima quarta-feira permitida e a prévia MUST informar essa diferença

#### Scenario: Calendário operacional fora do escopo atual
- **WHEN** uma data efetiva coincidir com feriado, dia sem funcionamento ou bloqueio não modelado
- **THEN** a data MUST continuar sendo tratada apenas pela regra de dia da semana nesta capability, sem inferência ou substituição; a validação operacional será acrescentada em uma especificação futura

#### Scenario: Última semana incompleta
- **WHEN** o total de sessões for alcançado antes de terminar a semana calendário
- **THEN** o sistema MUST encerrar a programação sem criar sessões adicionais

### Requirement: Confirmação reutiliza o horário do agendamento manual
Cada sessão calculada MUST reutilizar o horário informado no fluxo de agendamento
manual e as mesmas regras existentes de duração, preço, profissional opcional,
conflitos e capacidade. O sistema MUST NOT inventar horários, profissionais ou
dias alternativos. A validação de calendário operacional, feriados e bloqueios
não faz parte desta capability e será definida em uma especificação futura.

#### Scenario: Horário informado no agendamento manual
- **WHEN** a pessoa informar um horário válido no formulário de agendamento manual
- **THEN** a prévia MUST apresentar esse mesmo horário em todas as sessões e a confirmação MUST revalidar as regras existentes de disponibilidade

#### Scenario: Calendário operacional ainda não configurado
- **WHEN** o sistema não possuir fonte de feriados, funcionamento ou bloqueios aplicável a uma sessão
- **THEN** a prévia e a confirmação MUST continuar baseadas na data mínima, nos dias efetivos e no horário manual informado; a validação operacional MUST permanecer registrada como pendência de especificação futura

### Requirement: Prévia valida disponibilidade sem reservar definitivamente
Antes da confirmação, o sistema MUST apresentar a programação completa com
pacote, paciente, unidade, dias efetivos, frequência, data inicial solicitada,
primeira e última datas, valor total, horários e situação de cada sessão. A
prévia MUST validar as mesmas restrições de disponibilidade da agenda existente,
mas MUST NOT reservar horários definitivamente.

#### Scenario: Prévia integralmente disponível
- **WHEN** todas as sessões calculadas forem válidas e disponíveis no momento da simulação
- **THEN** a prévia MUST listar a quantidade exata de sessões e permitir a confirmação

#### Scenario: Conflito em data válida
- **WHEN** uma sessão calculada tiver conflito de paciente, profissional, capacidade, bloqueio ou outra restrição da agenda
- **THEN** a prévia MUST identificar a sessão conflituosa quando permitido e impedir a confirmação total até uma programação válida ser gerada

### Requirement: Confirmação cria contratação e agendamentos como uma operação idempotente
A confirmação MUST revalidar pacote, paciente, dias efetivos, horário manual e
disponibilidade pelas regras existentes. Em uma única operação lógica, o sistema MUST criar
a contratação, persistir seu snapshot imutável e criar os agendamentos
individuais vinculados a ela. A confirmação MUST usar chave de idempotência ou
mecanismo equivalente e MUST não deixar persistência parcial diante de falha.

#### Scenario: Confirmação bem-sucedida
- **WHEN** uma prévia válida for confirmada com uma chave de idempotência nova
- **THEN** o sistema MUST criar uma contratação e exatamente a quantidade contratada de agendamentos associados

#### Scenario: Falha ao criar uma sessão da contratação
- **WHEN** qualquer sessão falhar na revalidação ou persistência durante a confirmação
- **THEN** o sistema MUST reverter a operação e não deixar contratação ou conjunto parcial de agendamentos confirmados

#### Scenario: Repetição da mesma confirmação
- **WHEN** a mesma confirmação for recebida novamente com a mesma chave de idempotência e o mesmo escopo
- **THEN** o sistema MUST retornar o resultado previamente criado sem duplicar contratação ou agendamentos

### Requirement: Contratação preserva snapshot e rastreabilidade dos atendimentos
Cada contratação MUST registrar o pacote de origem e o snapshot das condições
confirmadas, incluindo serviço, unidade, quantidade, valor, dias efetivos,
frequência, datas e demais dados necessários para interpretar as sessões. Cada
agendamento criado por pacote MUST referenciar essa contratação; agendamentos
convencionais MUST continuar sem vínculo obrigatório.

#### Scenario: Alteração administrativa posterior do pacote
- **WHEN** uma contratação já confirmada for consultada após tentativa de alteração administrativa do pacote de origem
- **THEN** o sistema MUST apresentar as condições originalmente contratadas e seus agendamentos vinculados sem recalculá-los pela definição atual

#### Scenario: Agendamento convencional existente
- **WHEN** um agendamento individual existente ou criado manualmente não for originado de pacote
- **THEN** o sistema MUST preservá-lo como agendamento sem vínculo de contratação de pacote e com seu comportamento atual

### Requirement: Contratações permitem consultar sessões e situação sem presumir reposições
O sistema MUST permitir consultar uma contratação autorizada, seu snapshot e os
agendamentos vinculados, distinguindo quantidade contratada, sessões agendadas
e o estado retornado de cada atendimento. Esta capability MUST NOT decidir
automaticamente reposição, falta, cancelamento, transferência, reembolso ou
consumo financeiro, pois essas políticas não foram aprovadas.

#### Scenario: Consulta de contratação autorizada
- **WHEN** uma pessoa autorizada consultar uma contratação existente
- **THEN** o sistema MUST retornar suas condições confirmadas, quantidade contratada e a lista de sessões vinculadas com seus estados

#### Scenario: Ação de reposição não especificada
- **WHEN** uma sessão de pacote for cancelada ou marcada como falta
- **THEN** o sistema MUST preservar o vínculo e seu estado, sem gerar reposição ou alterar automaticamente a quantidade contratada

### Requirement: Agendamento por pacote respeita segurança e preserva o manual
Todas as operações de pacote MUST aplicar as permissões, isolamento de clínica e
restrições de unidade da agenda existente no servidor. O fluxo automático MUST
usar a mesma semântica de conflito, profissional opcional, capacidade, duração
e preço da agenda aplicável, sem alterar o contrato ou o comportamento da
criação manual de agendamentos.

#### Scenario: Usuário sem permissão suficiente
- **WHEN** uma pessoa sem permissão tentar consultar, pré-visualizar, confirmar ou ler contratação fora de seu escopo
- **THEN** o sistema MUST recusar a operação sem expor dados da clínica, unidade, paciente ou pacote não autorizado

#### Scenario: Criação manual após entrega do fluxo de pacote
- **WHEN** uma pessoa usar a ação manual “Agendar” para criar um atendimento individual válido
- **THEN** o sistema MUST preservar o contrato, as validações e o resultado atuais da criação manual
