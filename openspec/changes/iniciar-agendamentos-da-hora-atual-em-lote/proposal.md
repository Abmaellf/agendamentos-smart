# Proposal

## Why

A agenda já permite iniciar um atendimento pelo modal individual, mas iniciar uma turma exige repetir a ação em cada cartão. Um botão contextual na célula de hoje e da hora corrente permitirá iniciar os agendamentos elegíveis daquela faixa em uma única operação autorizada pela API.

## What Changes

- Exibir um único botão circular flutuante verde com “+” branco, dentro da célula de hoje e da hora corrente no fuso da unidade exibida. Às 07:00 ele fica em `[07:00,08:00)`; às 08:30, em `[08:00,09:00)`.
- Usar `GPT-BOTAO-FLUTUANTE-MARCAR-EM-ATENDIMENTO.png` como referência de ancoragem à direita da célula, respeitando o pedido textual de cor verde e sinal de mais.
- Ao acionar “+”, apresentar acima dele o botão `Iniciar todos`, com contexto da unidade e da faixa. Abrir o controle não altera dados; acionar `Iniciar todos` envia o comando.
- Consumir `POST /api/appointments/start-current-hour` com `{ unitId, hourStart }`, definido na change homônima da API irmã. A seleção considera o início do agendamento no intervalo semiaberto da hora, independentemente da duração ou da posição visual deslocada dos cartões.
- Tratar `Iniciar todos` como confirmação explícita de presença: `AGENDADO` e `FALTA` da faixa passam para `ATENDENDO` (“Em atendimento”), inclusive após dez minutos. Preservar cancelados e finalizados. Essa exceção ao prazo decorre do esclarecimento do usuário de que iniciar atendimento significa que a pessoa está no local.
- Atualizar a célula ao virar a hora/dia e ao retornar à aba, tratar carregamento, resultado vazio, falha e intervalo expirado, sem atualização otimista de status.

Fora de escopo: implementar código nesta etapa, alterar a execução automática do prazo de falta, iniciar toda a clínica ou semana, criar filtro de unidade novo, reabrir cancelados/finalizados, mudar enums, alterar o modal individual, ampliar dias/horários da grade, refatorar componentes legados ou adicionar dependências.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `weekly-appointments`: botão contextual da hora atual, início coletivo, feedback e atualização da agenda no escopo da unidade exibida.

## Impact

- Implementação futura em `src/features/appointments/pages/appointments-page.tsx`, componentes/modelo da feature, `api/appointments.ts`, `src/@types/appointment.ts`, builders/handlers MSW e testes relacionados.
- A página precisará obter o fuso da unidade pelo catálogo existente `GET /api/units`; `/auth/me` não fornece esse fuso. A clínica continua derivada da autenticação no servidor.
- Contrato aditivo, sem alteração de rota web, schema de banco ou permissão global. `ADMIN` e `BASIC` seguem o escopo validado pela API.
- Dependência: [proposta da API irmã](../../../../../api-agendamento-smart-api/agendamento-smart-api/openspec/changes/iniciar-agendamentos-da-hora-atual-em-lote/proposal.md). O endpoint deve estar disponível antes de habilitar a ação no frontend.
- Após implementação, atualizar o README da feature e a documentação do fluxo; nesta etapa são criados apenas artefatos de planejamento.
