# Design

## Context

Conforme `proposal.md`, a agenda semanal já renderiza uma régua lateral e uma matriz temporal em `AppointmentsPage`. O modelo da grade centraliza as constantes de início/fim em `src/features/appointments/model/weekly-grid.ts`; hoje o fim configurado é 18:00. A ação da hora corrente é renderizada dentro da coluna do dia atual, posicionada pelo topo da linha corrente e por um deslocamento fixo à direita.

A mudança é somente visual e de apresentação da grade. A ação existente, seu fuso, seu contexto, seu endpoint e seus estados de sucesso/erro permanecem inalterados.

## Goals / Non-Goals

**Goals:**

- Fazer a régua e a área temporal exibirem consistentemente o intervalo de 07:00 a 20:00.
- Ancorar o botão no eixo da borda entre o dia atual e a próxima coluna, acompanhando a geometria real da linha corrente.
- Aplicar a cor roxa translúcida e o diâmetro aproximado de 53 px sem perder foco visível, área de toque e comportamento de teclado.
- Cobrir o novo limite, a posição e a apresentação com testes automatizados compatíveis com jsdom e uma verificação visual local.

**Non-Goals:**

- Alterar a mutação `start-current-hour`, seus payloads ou a seleção de agendamentos.
- Criar uma nova ação de criação de agendamento ou mudar o botão “Novo agendamento”.
- Alterar colunas, navegação semanal, fuso da unidade, cartões, API ou outros modos de visualização.

## Decisions

### 1. Manter uma única fonte para o limite da grade

Atualizar `WEEK_GRID_END_HOUR` e `WEEK_GRID_END_MINUTES` no modelo existente e revisar a construção de rótulos, alturas e posições para que 20:00 seja o limite terminal visível, sem criar acidentalmente uma faixa extra 20:00–21:00. A matriz deverá manter o mesmo início, a mesma escala por hora e a mesma lógica de linhas expandidas por sobreposição.

Alternativa descartada: adicionar somente um texto “20:00” no DOM, pois isso deixaria a área clicável e os cartões limitados ao comportamento anterior.

### 2. Ancorar o centro do botão à borda da coluna

Calcular a posição horizontal a partir da borda direita da seção do dia corrente, usando a própria largura da coluna e transformação de metade do diâmetro para que o centro do círculo coincida com a divisão. A posição vertical continuará baseada em `currentRow.topPx`, com a linha real como referência quando sua altura variar. O contêiner da matriz seguirá com overflow visível para permitir a sobreposição controlada da borda.

Quando não houver uma próxima coluna renderizada, usar a borda direita da coluna corrente como fallback e manter pelo menos metade do botão dentro da área rolável. A opção expandida “Iniciar todos” deverá compartilhar o mesmo eixo, evitando que o menu se desloque para dentro da coluna.

Alternativas descartadas: `position: fixed`, porque se separa da rolagem da matriz; e coordenada baseada em uma largura fixa, porque falha em viewport estreita e em colunas redimensionadas.

### 3. Aplicar estilo explícito sem alterar a semântica do controle

Trocar o fundo verde do botão por `#6F3CFF` com cerca de 80% de opacidade no estado padrão, definir diâmetro de 53 px e ajustar o ícone proporcionalmente. Estados hover e foco poderão reforçar a opacidade/sombra, mas devem manter o matiz roxo e um anel de foco visível. O botão continuará sendo um controle nativo, com `aria-label`, `aria-expanded`, `stopPropagation` e o alvo mínimo de interação já existente.

Alternativa descartada: aplicar `opacity` ao contêiner inteiro, pois também reduziria a legibilidade do ícone e poderia afetar o menu expandido; a transparência deve pertencer ao fundo/estilo do botão.

### 4. Testar geometria por contrato visual observável

Atualizar o teste da página para exigir `20:00` e incluir um agendamento próximo do novo limite, como 19:30, confirmando que ele permanece na grade. Nos testes da ação corrente, verificar o estado atual e os marcadores de estilo/ancoragem expostos no DOM; quando o jsdom não puder calcular layout, usar estilos inline/classes e atributos semânticos estáveis em vez de afirmar pixels derivados de um navegador real.

Complementar com uma inspeção visual local em viewport larga e estreita, verificando: centro sobre a divisão, rolagem horizontal, linha corrente com cartões simultâneos, fallback da última coluna e contraste/foco.

## Risks / Trade-offs

- [O círculo pode sobrepor a coluna seguinte ou um cartão] → manter `z-index` controlado, overflow visível apenas na matriz e testar coluna estreita e cartões na faixa corrente.
- [Aumentar a janela pode expor inconsistência entre rótulos, altura e cálculo de cartões] → usar as constantes compartilhadas, testar 19:30 e validar a posição da linha terminal.
- [Transparência pode reduzir contraste sobre fundos claros] → verificar foco e leitura do ícone em estado padrão/hover e ajustar somente sombra/contraste, preservando o matiz solicitado.
- [A borda da última coluna não possui próximo dia] → aplicar o fallback interno documentado e cobrir a condição sem criar um botão em outro dia.

## Migration Plan

1. Alterar o modelo e a composição visual da grade, mantendo a mutação e os contratos existentes.
2. Atualizar os testes da agenda, da ação da hora corrente e a seção correspondente do README da feature.
3. Executar testes direcionados, lint e build; realizar inspeção visual local nos dois cenários de largura.
4. Em rollback, reverter apenas os valores/estilos da grade e do botão; nenhuma migração de dados ou reversão de status é necessária.
