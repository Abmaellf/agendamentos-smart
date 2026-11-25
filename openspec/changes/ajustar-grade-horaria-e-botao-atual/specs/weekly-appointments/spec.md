# Spec Delta

## MODIFIED Requirements

### Requirement: A agenda consulta e apresenta uma semana útil

A agenda MUST consultar os agendamentos da unidade ativa para o intervalo semanal selecionado e apresentar cinco colunas úteis, de segunda a sexta-feira, em uma matriz horária com régua lateral iniciando às 07:00 e linhas de uma hora até 20:00 na faixa padrão visível. A agenda MUST oferecer estados de carregamento, erro com nova tentativa, vazio e dados.

#### Scenario: Semana sem agendamentos

- **WHEN** a consulta da semana retornar uma lista vazia
- **THEN** a agenda MUST informar que não existem agendamentos na semana selecionada

#### Scenario: Mudança de semana

- **WHEN** a pessoa selecionar outra data ou usar a navegação semanal
- **THEN** a agenda MUST consultar e destacar a semana correspondente

#### Scenario: Grade horária semanal

- **WHEN** a agenda renderizar uma semana com dados
- **THEN** MUST exibir uma régua lateral com `07:00`, `08:00` e cada hora subsequente até `20:00`, e MUST fazer cada linha atravessar visualmente as cinco colunas de segunda a sexta-feira

## ADDED Requirements

### Requirement: O botão da hora corrente fica sobre a divisão entre dias

A agenda MUST posicionar o botão “+” da data e hora corrente sobre a borda que divide a coluna do dia atual e a próxima coluna visível, com o centro do botão alinhado à divisão e à linha horária corrente.

#### Scenario: Dia atual com próximo dia visível

- **WHEN** a semana visível contiver hoje, a hora corrente estiver entre 07:00 e 20:00 e houver uma próxima coluna à direita
- **THEN** o centro do botão “+” MUST coincidir visualmente com a linha divisória entre as duas colunas e MUST ficar associado à linha da hora corrente

#### Scenario: Linha corrente com altura variável

- **WHEN** cartões simultâneos aumentarem a altura da linha corrente ou a matriz for rolada horizontalmente
- **THEN** o botão MUST permanecer alinhado à mesma linha horária e à divisão entre colunas, sem ficar fixo na janela nem cobrir indevidamente os cartões

#### Scenario: Última coluna ou ausência de próxima coluna

- **WHEN** hoje estiver na última coluna visível ou não houver uma próxima coluna renderizada
- **THEN** o botão MUST permanecer ancorado à borda direita da coluna do dia atual, sem ultrapassar a área rolável da agenda

#### Scenario: Contexto fora da grade

- **WHEN** a semana visível não contiver hoje, a hora corrente estiver fora da janela `07:00–20:00` ou a sessão/unidade não fornecer contexto válido
- **THEN** a agenda MUST não exibir o botão “+” em outro dia ou horário como substituição

### Requirement: O botão da hora corrente usa a nova apresentação visual

O botão “+” MUST usar `#6F3CFF` como cor base com transparência visual aproximada de 80%, ter diâmetro entre 52 px e 54 px e manter contraste, foco visível e alvo de interação acessível.

#### Scenario: Estado padrão do botão

- **WHEN** o botão “+” for exibido no contexto da hora corrente
- **THEN** sua cor MUST derivar de `#6F3CFF` com opacidade aproximada de 80%, sem manter o verde sólido anterior

#### Scenario: Redução do diâmetro

- **WHEN** o diâmetro visual do botão for comparado ao diâmetro anterior de 56 px
- **THEN** o novo diâmetro MUST ficar entre 52 px e 54 px, correspondendo aproximadamente a uma redução de 5%

#### Scenario: Hover, foco e acionamento

- **WHEN** a pessoa passar o cursor, focar por teclado ou acionar o botão
- **THEN** o controle MUST preservar o matiz roxo definido, indicar claramente o foco e manter área de toque/teclado utilizável sem alterar a ação contextual existente
