# Design

## Context

Motivação e limites estão em [proposal.md](proposal.md); comportamento em [weekly-appointments](specs/weekly-appointments/spec.md).

Inspeção estática em 20/11/2026:

- `AppointmentsPage` consulta `session.activeUnitId`, compõe a grade e calcula `visualHourRows`, com alturas variáveis para grupos de cartões. O `CardDay` legado não é o local de composição da grade ativa.
- `appointmentsApi` usa RTK Query; a mutação individual invalida `Appointment/LIST`. O estado persistido é `ATENDENDO`, embora haja nomes históricos divergentes na documentação.
- `/auth/me` fornece unidade ativa, mas não fuso; `UnitOption` e `GET /api/units` já oferecem `timeZone`.
- Os testes `weekly-grid.test.ts`, `appointments-page.integration.test.tsx` e `appointment-details-dialog.integration.test.tsx` dão suporte à conversão temporal, à renderização e ao fluxo individual. Não foram executados nesta etapa documental.
- A referência [imagem fornecida](../../../../images/GPT-BOTAO-FLUTUANTE-MARCAR-EM-ATENDIMENTO.png) indica ancoragem à direita. Cor verde e “+” seguem a instrução textual, sem importar a imagem para o bundle.

## Goals / Non-Goals

**Goals:** integrar uma ação da feature à célula temporal existente, manter uma única fonte do contexto enviado e consumir o resultado autorizado sem alterações otimistas.

**Non-Goals:** deslocar o controle para o layout global, implementar modo Dia/Lista, converter o calendário legado, adicionar endpoint por paciente ou mudar o início individual.

## Decisions

### 1. Separar relógio, apresentação e mutação dentro da feature

Criar um modelo temporal testável e um componente pequeno para “+”/`Iniciar todos`; compor ambos em `AppointmentsPage`. O modelo recebe instante, fuso e contexto visível e produz data local, hora, início/fim absolutos e elegibilidade visual. Os tipos de request/response ficam em `src/@types/appointment.ts`, conforme a organização existente.

Alternativa descartada: implementar em `CardDay` ou dentro de cada cartão. Isso multiplicaria ações e ligaria o fluxo à quantidade/posição visual de pacientes.

### 2. Usar o fuso do catálogo e a geometria das linhas da grade

Obter a unidade de `useGetUnitsQuery` e cruzar seu ID com a unidade usada pela consulta da agenda. Não inferir o fuso pelo primeiro agendamento: uma faixa ou semana vazia ainda precisa de contexto válido. Reutilizar o ferramental temporal existente, sem dependências novas; converter instantes com offset explícito e testar fusos diferentes do navegador.

Ancorar o botão à borda direita e à parte inferior interna da célula corrente usando `visualHourRows`, reservando espaço para não ocultar os cartões. A posição vertical identifica a faixa inteira, não o minuto proporcional. O controle acompanha o contêiner de rolagem e respeita a área da coluna. A opção expande para cima; manter espaço/clipping adequado na primeira linha visível. Prever alvo de toque de pelo menos 44×44 px e foco visível.

Manter a célula atual renderizada mesmo quando a semana estiver vazia, junto da mensagem de ausência de agendamentos, para permitir “+” com ação desabilitada. Não criar novos dias/horas.

Alternativas descartadas: `position: fixed` na janela, offsets fixos por hora ou posição derivada dos cartões; essas abordagens divergem quando linhas crescem ou a página rola.

### 3. Atualizar o contexto temporal e fechar opções obsoletas

Programar atualização na próxima fronteira de hora, com verificação de relógio ao voltar à visibilidade/foco e imediatamente antes do envio. Recalcular também em troca de unidade/semana. Cancelar timers/listeners ao desmontar. Uma mudança da chave `{unitId, localDate, hourStart}` fecha a opção; uma requisição já enviada permanece associada à chave original.

O servidor valida o relógio definitivamente. Divergência do relógio do dispositivo pode produzir `APPOINTMENT_HOUR_NOT_CURRENT`; comunicar o problema e exigir nova ação, sem usar o erro para enviar automaticamente outra faixa. Testar hora repetida por mudança de offset com `hourStart` absoluto distinto.

Alternativa descartada: calcular `new Date()` somente no render inicial, pois o botão ficaria no horário antigo.

### 4. Confirmação de presença em uma chamada

Abrir “+” não envia mutação. A opção informa `Confirmar presença e iniciar todos — inclui faltas desta faixa`, além de unidade/data/horário. Não acrescentar um modal de confirmação ao fluxo solicitado. Ao acionar a opção, bloquear repetição enquanto houver envio.

`Iniciar todos` considera todos os inícios na hora, inclusive minutos posteriores ao momento do clique. A elegibilidade local usa `AGENDADO` ou `FALTA` somente como orientação; a API seleciona o conjunto atualizado. `ATENDENDO` é o único valor técnico de destino e é apresentado como “Em atendimento”. A exceção de presença é específica deste comando; o modal individual não é alterado.

Alternativa descartada: percorrer cartões e chamar o `PATCH` individual. Além de incompatível com a reativação de falta, isso produziria operações parciais e dependeria dos dados carregados no navegador.

### 5. Contrato compartilhado e feedback

Contrato proposto, ainda não implementado:

```http
POST /api/appointments/start-current-hour
Content-Type: application/json

{"unitId":"11111111-1111-4111-8111-111111111111","hourStart":"2026-11-20T08:00:00-04:00"}
```

Resposta de exemplo, com identificador sintético:

```json
{
  "unitId": "11111111-1111-4111-8111-111111111111",
  "timeZone": "America/Cuiaba",
  "hourStart": "2026-11-20T12:00:00Z",
  "hourEnd": "2026-11-20T13:00:00Z",
  "evaluatedAt": "2026-11-20T12:30:00Z",
  "targetStatus": "ATENDENDO",
  "matchedCount": 6,
  "updatedCount": 3,
  "skippedCount": 3,
  "skippedByStatus": {"ATENDENDO": 1, "CANCELADO": 1, "FINALIZADO": 1}
}
```

Os ignorados já tinham estado preservado no momento da avaliação; os convertidos de `FALTA` contam em `updatedCount`. A resposta não carrega pacientes nem cartões completos. Invalidar `Appointment/LIST` após confirmação e renderizar a consulta confirmada. Se o usuário mudar de contexto durante o envio, o resultado não deve ser aplicado manualmente à lista nova; feedback deve identificar o contexto original.

| Retorno | Comportamento |
| --- | --- |
| 200, atualizações positivas | Informar iniciados/ignorados, fechar e refazer consulta |
| 200, zero atualizações | Informar que nada foi iniciado e refazer consulta |
| 409 `APPOINTMENT_HOUR_NOT_CURRENT` | Fechar, recalcular a célula e exigir nova abertura |
| 409 conflito de paciente/profissional/capacidade | Informar que o lote não foi iniciado e atualizar a consulta para revisão |
| 400/422 | Informar contexto inválido, sem fallback temporal |
| 401/403/404 | Tratamento existente de sessão/escopo; não tentar outra unidade |
| Rede/timeout/5xx | Resultado não confirmado; consultar quando possível, sem retry automático da mutação |

Uma resposta perdida pode esconder uma operação já confirmada. A repetição explícita é segura por estado, mas não promete repetir as mesmas contagens: agendamentos criados depois podem entrar na nova execução da mesma hora.

## Risks / Trade-offs

- [Falta liberou capacidade já reutilizada] → o backend rejeita atomicamente conflitos de reativação; explicar a falha e não contornar com chamadas individuais.
- [Fuso e relógio diferentes] → usar catálogo autorizado, offsets explícitos, teste de meia-noite e validação final no servidor.
- [Cartões ampliam a linha] → ancorar à geometria temporal existente, verificar primeira linha, viewport estreita e rolagem.
- [Specs históricas têm nomes de estado divergentes] → usar `ATENDENDO` no novo contrato; não renomear enums nem reescrever histórico.

## Migration Plan

1. Implementar e disponibilizar a change homônima da API antes de habilitar a ação.
2. Implementar tipos/mutação, modelo temporal e controle da célula; cobrir o contrato com MSW e os cenários temporais com relógio controlado.
3. Verificar visualmente com a referência, executar testes pertinentes, lint, build e validação estrita; atualizar o README da feature com o comportamento entregue.
4. Em reversão da entrega, remover/desabilitar somente a ação visual. Nenhum status já confirmado deve ser revertido automaticamente.
