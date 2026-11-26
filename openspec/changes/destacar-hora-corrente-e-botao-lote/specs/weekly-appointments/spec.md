# Spec Delta

## ADDED Requirements

### Requirement: Cada célula de dia e hora destaca no hover

A agenda MUST manter o hover verde existente em toda a linha da hora e MUST exibir um contorno `solid` de `1px` em `#6F3CFF` somente na célula de dia e hora sob o cursor.

#### Scenario: Estado normal das células

- **WHEN** a grade semanal for exibida sem o cursor sobre uma célula de dia e hora
- **THEN** as células MUST permanecer sem a linha roxa de hover

#### Scenario: Hover sobre uma célula selecionada

- **WHEN** a pessoa posicionar o cursor sobre uma combinação específica de dia e hora
- **THEN** toda a linha da hora MUST manter o hover verde, enquanto somente essa célula MUST receber borda `solid` de `1px` em `#6F3CFF`

#### Scenario: Outras células permanecem neutras

- **WHEN** uma célula estiver fora da combinação de dia e hora sob o cursor
- **THEN** a célula MUST não receber a borda roxa de hover

#### Scenario: Hover não executa operação

- **WHEN** a pessoa entrar ou sair de qualquer célula de dia e hora
- **THEN** a borda MUST aparecer ou desaparecer sem iniciar atualização, mudar status ou realizar chamada HTTP

### Requirement: O botão circular de atualização em lote ocupa o canto inferior direito

A agenda MUST posicionar somente um botão circular com “+” da hora corrente no canto inferior direito do agrupamento, usando `border-radius: 50%` e sem diagonal, área triangular ou linha roxa permanente ao redor da faixa.

#### Scenario: Agrupamento corrente renderizado

- **WHEN** o dia corrente e a hora corrente forem exibidos na grade
- **THEN** o botão “+” MUST ficar ancorado ao canto inferior direito do contêiner da faixa, MUST ter formato circular e não MUST renderizar composição triangular ou diagonal adicional

#### Scenario: Hover ou foco por teclado no botão

- **WHEN** a pessoa passar o cursor sobre o botão ou alcançar o controle por teclado
- **THEN** o botão circular MUST preservar o matiz `#6F3CFF`, MUST manter indicação de foco visível e MUST continuar identificável por nome acessível

#### Scenario: Atualização em lote confirmada

- **WHEN** a pessoa acionar o botão “+” e confirmar a ação de iniciar os atendimentos da hora corrente
- **THEN** o sistema MUST atualizar todos os agendamentos elegíveis daquela unidade, dia e hora corrente pela operação em lote existente, MUST preservar os demais estados não elegíveis e MUST atualizar a agenda após a confirmação

#### Scenario: Não há agendamento elegível

- **WHEN** a hora corrente não possuir agendamento elegível para atualização
- **THEN** o controle ou a opção de atualização em lote MUST permanecer desabilitado, MUST informar que nenhum agendamento pode ser iniciado e MUST não enviar chamadas individuais
