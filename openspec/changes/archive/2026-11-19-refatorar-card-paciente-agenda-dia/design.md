# Design

## Context

A página semanal já converte os agendamentos para horário local, agrupa intervalos sobrepostos e posiciona cada card de forma absoluta dentro da coluna do dia. O card atual usa rolagem interna e o número de lanes é tratado apenas como distribuição horizontal. Ver `proposal.md` e `specs/weekly-appointments/spec.md` para a motivação e o contrato observável.

## Goals / Non-Goals

**Goals:**

- Separar posicionamento temporal de empacotamento visual, permitindo que um grupo simultâneo flua para novas linhas conforme a largura real da coluna.
- Manter uma ordem determinística dos cards, o vínculo com o horário local e a identificação completa para acessibilidade.
- Fazer a linha horária destacada ser uma camada visual comum à régua e à matriz.

**Non-Goals:**

- Alterar o contrato de `Appointment`, a consulta semanal ou qualquer endpoint.
- Criar ações ao clicar/hover, seleção de horário ou novos modos de visualização.
- Transformar a matriz inteira em uma área de rolagem vertical ou horizontal diferente da rolagem controlada já existente para telas estreitas.

## Decisions

### 1. Manter a ordenação temporal e adicionar uma etapa de empacotamento visual

O modelo continuará calculando dia, horário inicial, duração e grupos de sobreposição. A apresentação deverá usar esses grupos como unidades de layout: cada grupo ocupa a faixa temporal correspondente e distribui seus cards em um contêiner de largura total com fluxo por linhas, usando uma largura mínima visual para cada card. A capacidade da primeira linha será derivada da largura útil medida da coluna; os excedentes irão para linhas seguintes começando no índice zero.

Alternativa rejeitada: continuar usando somente `lane`/`laneCount` como colunas absolutas. Essa abordagem mantém cards estreitos ou cortados quando a quantidade simultânea excede a largura disponível.

### 2. Reservar altura para as linhas criadas pelo empacotamento

O layout deverá calcular a altura visual necessária de cada grupo depois do empacotamento e propagar o maior fim visual para a altura da matriz. A altura temporal mínima do grupo continua sendo a duração do atendimento; quando a quantidade de linhas exigir mais espaço, a faixa cresce para que nenhum card seja encoberto pelo grupo seguinte. A largura útil deve ser observada de forma responsiva, sem depender de um número fixo de cards por linha.

Alternativa rejeitada: deixar cada card absoluto com a mesma altura temporal e permitir que uma segunda linha transborde. Isso cria sobreposição com outros horários e não atende à leitura contínua da grade.

### 3. Reduzir somente a informação visual, preservando a informação acessível

Uma função de apresentação deve extrair o primeiro termo do nome completo já normalizado. O card exibirá esse termo e o serviço dentro dos limites visuais, sem `overflow-auto`; o nome completo, serviço, horário e estado continuarão no nome acessível e/ou na dica contextual. O dado original da API não será alterado.

Alternativa rejeitada: truncar o nome completo por quantidade fixa de caracteres. Isso não implementa “primeiro nome” e produz resultados inconsistentes entre larguras.

### 4. Usar uma camada de linha horária compartilhada

Cada faixa horária terá uma representação interativa alinhada à régua e à matriz. O estado local da hora sob o cursor (e, quando aplicável, foco equivalente) controlará um destaque visual de largura total; cards permanecerão acima dessa camada para não perder legibilidade nem interação futura. Sair da faixa remove o destaque. Nenhuma mudança de seleção, chamada HTTP ou evento de domínio será disparada.

Alternativa rejeitada: aplicar `:hover` somente às células individuais de cada dia. Isso fragmenta o destaque e não cobre a régua lateral como na referência visual.

### 5. Testar o contrato no modelo e na página

Os testes do modelo deverão verificar ordem, agrupamento e quantidade de linhas/capacidade quando houver simultâneos. Os testes de integração deverão verificar primeiro nome visível, ausência de classes/estilos de rolagem interna, continuação acessível do nome completo, quebra da linha e atributos/estado de hover da régua e das cinco colunas. As propriedades existentes de fuso, duração, status e rolagem horizontal controlada da viewport permanecem cobertas.

## Risks / Trade-offs

- [Largura da coluna varia entre viewport e rolagem horizontal] → medir a área útil da coluna e recalcular o empacotamento quando ela mudar; manter a largura mínima da grade já existente como limite de segurança.
- [Uma linha adicional pode aumentar a altura e deslocar horários posteriores] → usar o maior fim visual dos grupos para recalcular a altura da matriz e garantir que grupos posteriores comecem após a área realmente ocupada.
- [Truncamento visual pode ocultar detalhes para quem enxerga] → manter o conteúdo completo no nome acessível e na dica contextual, além de exibir o serviço de forma legível quando houver espaço.
- [Hover pode reduzir contraste ou competir com cards coloridos] → aplicar o destaque em camada de fundo com contraste moderado, mantendo cards em camada superior e validando os estados canônicos de cor.

## Migration Plan

Não há migração de dados nem rollout de API. A implementação substitui apenas o layout da grade no frontend; rollback consiste em reverter os arquivos da página/modelo e os testes associados. A validação deverá incluir testes direcionados, lint, build e `openspec validate refatorar-card-paciente-agenda-dia --strict`.
