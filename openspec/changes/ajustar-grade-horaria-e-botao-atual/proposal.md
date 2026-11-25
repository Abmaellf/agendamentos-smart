# Proposal

## Why

A régua da agenda semanal termina visualmente às 18:00, embora a operação precise consultar e organizar atendimentos até 20:00. Além disso, o botão “+” da hora corrente fica dentro da coluna do dia, dificultando a associação visual com o limite entre o dia atual e o próximo; o ajuste deve aproximá-lo dessa divisão e reduzir seu peso visual.

## What Changes

- Estender a faixa horária visível da agenda semanal de 18:00 para 20:00, preservando o início às 07:00 e a leitura das linhas de uma hora.
- Reposicionar o botão “+” do dia e horário corrente sobre a linha divisória entre a coluna do dia atual e a próxima coluna visível, centrando o botão nessa borda e mantendo-o ancorado à linha horária correta durante rolagem e mudanças de altura.
- Alterar a cor base do botão para `#6F3CFF` com transparência visual; para tornar o critério testável, a proposta considera opacidade aproximada de 80% no estado padrão, com estados de hover/foco mantendo o mesmo matiz e contraste.
- Reduzir aproximadamente 5% o diâmetro visual atual do botão, de 56 px para cerca de 53 px, mantendo alvo de interação e foco acessível.
- Atualizar testes de integração/unidade e a documentação da feature para refletir a nova janela e a apresentação do controle.

Fora de escopo: alteração do contrato HTTP de agendamentos, regras de autorização, cálculo do fuso da unidade, ação `Iniciar todos`, criação manual, modos Dia/Lista e layout de outras telas.

## Capabilities

### New Capabilities

<!-- Nenhuma capability nova. -->

### Modified Capabilities

- `weekly-appointments`: ampliar a régua padrão até 20:00 e definir a posição, cor, transparência e escala do botão contextual da hora corrente.

## Impact

- Código principal: `src/features/appointments/model/weekly-grid.ts` e `src/features/appointments/pages/appointments-page.tsx`.
- Verificações: testes da grade semanal, testes de integração da página e da ação da hora corrente.
- Documentação: `src/features/appointments/README.md`.
- Não há alteração de endpoints, payloads, rotas, dependências, dados persistidos ou permissões.
