# Proposal

## Why

A agenda atual distribui os agendamentos em uma lista vertical por dia e não reproduz a referência visual de uma matriz horária. A mudança precisa tornar explícitas as horas, a duração e a simultaneidade dos atendimentos para que cada paciente ocupe a posição correta na semana e a leitura corresponda à imagem fornecida.

## What Changes

- Substituir a lista vertical de cartões por uma grade semanal com uma régua lateral de horários em intervalos de uma hora, iniciando às 07:00 e com faixa visível padrão até 18:00.
- Apresentar cinco colunas de segunda a sexta-feira, com o dia da semana e a data no topo de cada coluna; destacar o dia atual conforme a referência.
- Posicionar cada atendimento na matriz conforme seu horário local e sua duração, fazendo os cards ocuparem a faixa temporal correspondente.
- Renderizar atendimentos com intervalos simultâneos lado a lado, preservando um card individual para cada paciente e serviço.
- Usar as quatro famílias visuais da referência e exibir uma legenda inferior com os rótulos “Aguardando atendimento”, “Atendida”, “Cancelado” e “Falta”, incluindo suas descrições auxiliares.
- Preservar a consulta semanal, o contrato de `/api/appointments`, o cálculo de fuso, a criação manual e os estados de carregamento, erro e vazio.

Assumptions registradas: a faixa horária inicial é 07:00 e a faixa visível padrão termina às 18:00; atendimentos que ultrapassarem esse limite continuam sendo posicionados sem perder conteúdo. A associação visual permanece `AGENDADO`/`REAGENDADO` em amarelo, `EMATENDIMENTO`/`FINALIZADO` em verde, `CANCELADO` em grafite e `FALTA` em vermelho.

Fora de escopo: novos endpoints, alteração do payload da API, regras de conflito/capacidade, persistência de novos estados, visualizações diária/lista funcionais e migração dos componentes legados sem consumidores.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `weekly-appointments`: amplia a agenda semanal para uma matriz horária de segunda a sexta com posicionamento por duração, simultaneidade lateral, cabeçalhos de dia/data e legenda de estados.

## Impact

- Código afetado: `src/features/appointments/pages/appointments-page.tsx`, possíveis modelos auxiliares da feature e os testes de integração da agenda.
- Os campos já retornados por `Appointment` — `startsAt`, `timeZone`, `durationMinutes`, paciente, serviço e estado — serão usados para a composição visual; não há alteração de contrato HTTP ou dados persistidos.
- A interface poderá exigir rolagem horizontal em telas estreitas, mas a régua de horários e os cabeçalhos devem permanecer identificáveis e acessíveis.
- A inspeção visual deve comparar a grade, os cards simultâneos, o destaque do dia atual e a legenda com a imagem fornecida.
