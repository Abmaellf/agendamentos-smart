# Spec Delta

## ADDED Requirements

### Requirement: O botão coletivo aparece somente na célula da hora atual

A agenda MUST exibir um único botão circular verde com “+” branco na célula de hoje e da hora corrente, calculadas no fuso da unidade exibida. O botão MUST ficar dentro da célula, junto à borda direita, e acompanhar sua rolagem e altura, sem cobrir a identificação ou impedir o acionamento dos cartões.

#### Scenario: Início exato da hora
- **WHEN** forem 07:00 no fuso da unidade e hoje estiver na semana visível
- **THEN** o botão MUST aparecer somente na célula de hoje correspondente a `[07:00,08:00)`

#### Scenario: Minutos intermediários
- **WHEN** forem 08:30 no fuso da unidade
- **THEN** o botão MUST permanecer na célula de hoje correspondente a `[08:00,09:00)`, sem seguir proporcionalmente o minuto dentro da célula

#### Scenario: Outra semana ou faixa fora da grade
- **WHEN** a semana visível não contiver hoje, hoje não possuir coluna na grade ou a hora atual não possuir célula representada
- **THEN** o botão MUST não aparecer em outro dia ou horário como alternativa

#### Scenario: Grade com cartões distribuídos em várias linhas
- **WHEN** a altura da célula aumentar por cartões simultâneos ou houver rolagem em tela estreita
- **THEN** o botão MUST continuar ancorado à célula temporal correta, sem migrar para a faixa visual de outro horário nem ficar fixo na janela

#### Scenario: Célula sem agendamentos elegíveis
- **WHEN** hoje e a hora atual estiverem representados, mas não houver `AGENDADO` ou `FALTA` na faixa consultada
- **THEN** o botão “+” MUST continuar visível e sua ação `Iniciar todos` MUST ficar desabilitada com a indicação `Nenhum agendamento para iniciar nesta faixa`

### Requirement: A ação acompanha o relógio e o contexto da unidade

A agenda MUST recalcular a célula corrente sem recarga manual ao virar a hora ou o dia e ao voltar de uma aba suspensa. Mudança de semana, unidade ou faixa MUST fechar a ação expandida. Sem sessão, unidade ou fuso válidos, o comando MUST permanecer indisponível, sem adotar silenciosamente o fuso do navegador.

#### Scenario: Virada de hora com opção aberta
- **WHEN** o relógio da unidade passar de 08:59 para 09:00 com `Iniciar todos` aberto
- **THEN** a opção MUST fechar e o botão MUST passar para `[09:00,10:00)`, se essa célula existir, exigindo nova abertura antes do comando

#### Scenario: Virada de dia ou retorno à aba
- **WHEN** a página permanecer aberta durante a meia-noite ou retornar de suspensão
- **THEN** a agenda MUST recalcular hoje e a hora no fuso da unidade antes de aceitar outro acionamento e MUST remover o botão do contexto antigo

#### Scenario: Navegador em outro fuso
- **WHEN** o navegador estiver em um fuso diferente do cadastrado para a unidade
- **THEN** a coluna, a faixa e o contexto anunciado pelo botão MUST corresponder à data e hora da unidade

#### Scenario: Contexto indisponível
- **WHEN** sessão, catálogo da unidade ou agenda estiverem carregando ou em erro, ou o fuso não for válido
- **THEN** a interface MUST informar a indisponibilidade ou carregamento e MUST não enviar o comando coletivo

### Requirement: O botão de mais revela a opção Iniciar todos acima dele

Acionar “+” MUST alternar a exibição de `Iniciar todos` acima do botão, sem alterar status. A opção MUST identificar unidade, data e faixa e informar que confirma presença de todos os agendamentos elegíveis, inclusive faltas. Os controles MUST permitir teclado e toque, indicar expansão e manter foco visível.

#### Scenario: Expandir e recolher
- **WHEN** a pessoa acionar “+” por clique, toque, Enter ou Espaço
- **THEN** a opção MUST abrir acima do botão ou recolher caso já esteja aberta, sem enviar mutação

#### Scenario: Fechar e recuperar foco
- **WHEN** a pessoa pressionar Escape ou clicar fora da opção aberta
- **THEN** a opção MUST fechar sem alteração de dados e, ao fechar por Escape, o foco MUST retornar ao botão “+”

#### Scenario: Acionamento acessível e sem conflito com o cartão
- **WHEN** a pessoa navegar pelo teclado ou acionar o botão sobre uma célula com cartões
- **THEN** os controles MUST anunciar sua ação e contexto, permitir chegar a `Iniciar todos` e MUST não abrir os detalhes de um cartão por propagação do mesmo evento

### Requirement: Iniciar todos envia um único comando no contexto exibido

A interface MUST enviar uma única chamada `POST /api/appointments/start-current-hour` com `unitId` da agenda e `hourStart` ISO 8601 com offset ou `Z`. MUST não enviar clínica, status, lista de IDs nem intervalo final escolhido pelo cliente. Durante o envio, MUST impedir submissões duplicadas e exibir `Iniciando...`.

#### Scenario: Confirmação explícita de presença na hora corrente
- **WHEN** a pessoa acionar `Iniciar todos` às 08:30 na unidade exibida
- **THEN** a requisição MUST identificar o início absoluto das 08:00 locais de hoje e a unidade exibida, solicitando a seleção completa da faixa no servidor

#### Scenario: Definição de pertencimento à faixa
- **WHEN** a célula representar `[08:00,09:00)`
- **THEN** o comando MUST abranger inícios às 08:00, 08:30 e 08:59, inclusive minutos ainda futuros dentro da hora; MUST não incluir um agendamento iniciado às 07:30 por sobreposição de duração nem um iniciado às 09:00

#### Scenario: Faltas da hora representam presença confirmada
- **WHEN** a faixa contiver `AGENDADO`, `FALTA`, `ATENDENDO`, `CANCELADO` e `FINALIZADO`
- **THEN** a interface MUST permitir o comando para `AGENDADO` e `FALTA`, inclusive após o prazo automático, e MUST apresentar o resultado confirmado sem reabrir cancelados ou finalizados

#### Scenario: Duplo clique
- **WHEN** a pessoa tentar acionar novamente enquanto houver uma requisição pendente
- **THEN** a interface MUST manter apenas uma chamada em andamento e MUST não simular sucesso antecipadamente

### Requirement: O resultado coletivo atualiza a agenda após confirmação

Após HTTP 200, a interface MUST apresentar a quantidade iniciada e ignorada, fechar a opção e refazer a consulta da agenda. Os cartões MUST refletir `ATENDENDO` como “Em atendimento” com a apresentação verde existente somente após confirmação. Resultado sem alterações MUST informar que nenhum agendamento foi iniciado.

#### Scenario: Sucesso com estados mistos
- **WHEN** a API responder `matchedCount=5`, `updatedCount=2` e `skippedCount=3`
- **THEN** a interface MUST informar `2 atendimentos iniciados` e `3 agendamentos não alterados`, atualizar a consulta e preservar os demais estados

#### Scenario: Lista mudou enquanto a opção estava aberta
- **WHEN** a resposta indicar `updatedCount=0`, por faixa vazia ou todos já iniciados/cancelados/finalizados
- **THEN** a interface MUST informar `Nenhum agendamento foi iniciado`, atualizar a consulta e MUST não apresentar uma confirmação falsa de início

#### Scenario: Falha ao recarregar após comando confirmado
- **WHEN** o comando for confirmado mas a consulta seguinte falhar
- **THEN** a interface MUST distinguir `Atendimentos iniciados; não foi possível atualizar a agenda` e oferecer nova consulta sem repetir automaticamente o comando

### Requirement: Falhas e contexto expirado não alteram a seleção silenciosamente

Em erro, a interface MUST informar a falha e manter os últimos estados confirmados até nova consulta. MUST não repetir a mutação automaticamente nem substituir unidade ou faixa para tentar novamente. Uma resposta recebida após troca de contexto MUST não sobrescrever os cartões de outro contexto.

#### Scenario: A hora mudou antes da autorização no servidor
- **WHEN** a API responder HTTP 409 com `APPOINTMENT_HOUR_NOT_CURRENT`
- **THEN** a interface MUST fechar a opção, recalcular a célula e informar `O horário mudou. Abra a ação na faixa atual.`, sem reenviar o comando para outra faixa

#### Scenario: Reativação de falta causa conflito
- **WHEN** a API rejeitar o lote por conflito de paciente, profissional ou capacidade
- **THEN** a interface MUST mostrar a orientação de domínio, informar que o lote não foi iniciado e atualizar a consulta para revisão, sem executar chamadas individuais como alternativa

#### Scenario: Rede indisponível ou resposta perdida
- **WHEN** ocorrer falha de rede, timeout ou erro técnico sem confirmação
- **THEN** a interface MUST informar que não conseguiu confirmar o resultado, consultar novamente quando possível e permitir nova tentativa explícita somente no contexto ainda atual

#### Scenario: Sessão expirada ou unidade não autorizada
- **WHEN** a API responder 401, 403 ou 404 para a ação
- **THEN** a interface MUST seguir o tratamento de sessão/erro existente, impedir repetição no contexto inválido e MUST não tentar outra unidade

## MODIFIED Requirements

### Requirement: A falta automática respeita o limite de dez minutos

O sistema MUST considerar `FALTA` quando o horário de início do agendamento tiver ultrapassado dez minutos sem confirmação de `ATENDENDO`, usando o instante absoluto persistido pela API e sem substituir um status de atendimento já iniciado. `Iniciar todos` MUST poder confirmar presença e converter `FALTA` da hora corrente para `ATENDENDO`; o início individual mantém sua restrição atual.

#### Scenario: Dez minutos após o início sem atendimento iniciado

- **WHEN** o horário atual ultrapassar em pelo menos dez minutos o início local de um agendamento ainda `AGENDADO`
- **THEN** o agendamento MUST ser apresentado como `FALTA`, a ação de início individual MUST ficar indisponível e o cancelamento MUST permanecer desabilitado; a confirmação coletiva da hora corrente MUST continuar disponível

#### Scenario: Atendimento iniciado antes do limite

- **WHEN** a API confirmar `ATENDENDO` antes de completar dez minutos do horário inicial
- **THEN** a regra automática MUST não converter o agendamento para `FALTA`, mesmo após a passagem dos dez minutos

#### Scenario: Reabertura após o limite

- **WHEN** a pessoa abrir ou recarregar a agenda após o limite de dez minutos para um agendamento que permaneceu `AGENDADO`
- **THEN** o resultado MUST continuar sendo `FALTA` sem depender exclusivamente de um timer mantido pelo modal aberto

#### Scenario: Presença confirmada coletivamente após falta
- **WHEN** `Iniciar todos` confirmar pela API um agendamento em `FALTA` na hora corrente
- **THEN** ele MUST passar para `ATENDENDO` e permanecer nesse estado após novas execuções do monitor
