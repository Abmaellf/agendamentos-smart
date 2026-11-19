# Spec Delta

## ADDED Requirements

### Requirement: A agenda permite consultar os detalhes do agendamento

A agenda MUST abrir um painel modal de detalhes ao selecionar um cartão e MUST apresentar, em modo de consulta, a identificação do paciente, o identificador disponível, o serviço, a data, o horário, a duração, o profissional quando disponível e o status do agendamento.

#### Scenario: Abrir detalhes pelo cartão

- **WHEN** a pessoa selecionar um cartão de paciente na agenda semanal
- **THEN** a interface MUST abrir o modal “Detalhes do agendamento” com os dados do mesmo `appointment`, sem consultar ou exibir dados de outro paciente

#### Scenario: Fechar detalhes sem alteração

- **WHEN** a pessoa fechar o modal por fechar, cancelar ou tecla `Escape` sem confirmar uma transição
- **THEN** a interface MUST retornar à agenda e MUST preservar o agendamento e o status exibidos antes da abertura

#### Scenario: Campo ainda ausente no contrato

- **WHEN** um detalhe visual da referência não estiver disponível no contrato retornado, como telefone, e-mail, nascimento, sala ou observações
- **THEN** a interface MUST manter o espaço identificável como indisponível, desabilitar sua ação e informar `Em breve`, sem fabricar um valor

### Requirement: O modal apresenta o estado inicial e a ação de início

O modal MUST mapear `AGENDADO` para `Aguardando atendimento`, selecionar esse estado por padrão e oferecer a ação `Iniciar agendamento` para solicitar a transição para `ATENDENDO`.

#### Scenario: Agendamento aguardando atendimento

- **WHEN** o modal for aberto para um agendamento com status `AGENDADO`
- **THEN** `Aguardando atendimento` MUST estar ativo, `Iniciar agendamento` MUST estar habilitado e `Cancelar agendamento` MUST estar habilitado

#### Scenario: Iniciar atendimento

- **WHEN** a pessoa acionar `Iniciar agendamento` e a API confirmar a transição
- **THEN** o status MUST ser `ATENDENDO`, a interface MUST comunicar `Atendimento iniciado`, o controle de início MUST permanecer acionado/indisponível para reversão e o cancelamento MUST ficar desabilitado

#### Scenario: Status já iniciado ou finalizado

- **WHEN** o agendamento for aberto com status `ATENDENDO` ou `FINALIZADO`
- **THEN** o modal MUST refletir o status retornado, MUST impedir o início novamente e MUST manter o cancelamento desabilitado

### Requirement: O cancelamento é limitado ao estado aguardando

O modal MUST permitir a transição para `CANCELADO` somente enquanto o agendamento estiver em `AGENDADO` e MUST impedir a ação para qualquer outro status.

#### Scenario: Cancelar agendamento aguardando

- **WHEN** a pessoa acionar `Cancelar agendamento` para um agendamento `AGENDADO` e a API confirmar
- **THEN** o status MUST mudar para `CANCELADO`, o modal MUST comunicar `Cancelado` e nenhuma ação de início ou novo cancelamento MUST permanecer habilitada

#### Scenario: Cancelamento fora da condição permitida

- **WHEN** o status for `ATENDENDO`, `FALTA`, `CANCELADO` ou `FINALIZADO`
- **THEN** `Cancelar agendamento` MUST estar desabilitado e a interface MUST impedir o envio de uma transição de cancelamento

### Requirement: A falta automática respeita o limite de dez minutos

O sistema MUST considerar `FALTA` quando o horário de início do agendamento tiver ultrapassado dez minutos sem confirmação de `ATENDENDO`, usando o instante absoluto persistido pela API e sem substituir um status de atendimento já iniciado.

#### Scenario: Dez minutos após o início sem atendimento iniciado

- **WHEN** o horário atual ultrapassar em pelo menos dez minutos o início local de um agendamento ainda `AGENDADO`
- **THEN** o agendamento MUST ser apresentado como `FALTA`, a ação de início MUST ficar indisponível e o cancelamento MUST permanecer desabilitado

#### Scenario: Atendimento iniciado antes do limite

- **WHEN** a API confirmar `ATENDENDO` antes de completar dez minutos do horário inicial
- **THEN** a regra automática MUST não converter o agendamento para `FALTA`, mesmo após a passagem dos dez minutos

#### Scenario: Reabertura após o limite

- **WHEN** a pessoa abrir ou recarregar a agenda após o limite de dez minutos para um agendamento que permaneceu `AGENDADO`
- **THEN** o resultado MUST continuar sendo `FALTA` sem depender exclusivamente de um timer mantido pelo modal aberto

### Requirement: As transições de status são persistidas e refletem a agenda

As ações de início, cancelamento e falta automática MUST usar a transição autorizada pelo backend, tratar carregamento e erro, e atualizar a agenda somente após confirmação da alteração.

#### Scenario: Transição confirmada

- **WHEN** a API aceitar uma mudança para `ATENDENDO`, `CANCELADO` ou `FALTA`
- **THEN** o modal MUST atualizar o status com a resposta confirmada e a agenda MUST refletir a nova cor, rótulo e habilitação das ações

#### Scenario: Falha na transição

- **WHEN** a API rejeitar a transição ou ocorrer falha de rede
- **THEN** o modal MUST permanecer aberto, informar que não foi possível atualizar o status, reabilitar a ação aplicável e MUST manter o status anterior confirmado

#### Scenario: Contrato de atualização

- **WHEN** uma transição manual for solicitada
- **THEN** o frontend MUST enviar o identificador do agendamento e o status pretendido ao contrato de atualização de status da API e MUST invalidar/refazer a consulta da agenda após sucesso

### Requirement: Recursos fora do primeiro incremento são visíveis e desabilitados

O modal MUST mostrar os recursos previstos na referência que não pertencem a esta change como controles desabilitados, acompanhados da mensagem `Em breve`, sem executar operação de domínio ao serem selecionados.

#### Scenario: Interação com recurso futuro

- **WHEN** a pessoa tentar selecionar `Atendida`, editar agendamento, ver cadastro completo, editar observações ou outro recurso fora do escopo
- **THEN** o controle MUST permanecer desabilitado, MUST exibir `Em breve` e MUST não iniciar chamada HTTP nem alterar o agendamento
