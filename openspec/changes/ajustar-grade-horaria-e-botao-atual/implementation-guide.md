
# Guia de implementação — ajustar-grade-horaria-e-botao-atual

## 1. Objetivo da change

A change ajusta a apresentação da agenda semanal do front-end:

1. amplia a régua visual de horários de 07:00 até 20:00;
2. posiciona o botão + da data/hora corrente sobre a divisão entre a coluna do dia atual e a próxima coluna;
3. troca o verde do botão por #6F3CFF com transparência aproximada de 80%;
4. reduz o diâmetro de 56 px para 53 px;
5. atualiza testes e documentação sem alterar o contrato da API.

A alteração não muda rotas, endpoints, payloads, permissões, dados persistidos, regras de conflito, fuso autorizado pela unidade ou a lógica de negócio da ação Iniciar todos.

## 2. Estado da implementação

### Change aplicada

~~~text
ajustar-grade-horaria-e-botao-atual
~~~

Artefatos OpenSpec usados:

~~~text
openspec/changes/ajustar-grade-horaria-e-botao-atual/
├── proposal.md
├── design.md
├── tasks.md
├── implementation-guide.md
└── specs/weekly-appointments/spec.md
~~~

A change modifica a capability existente weekly-appointments.

### Progresso das tarefas

| Tarefa | Estado | Evidência |
| --- | --- | --- |
| 1.1 — ampliar o limite da grade | concluída | 5 testes unitários passaram |
| 1.2 — validar 20:00 e 19:30 | concluída | 31 testes de grade/página passaram |
| 2.1 — ancorar o botão | concluída | 4 testes da ação corrente passaram |
| 2.2 — cor, transparência e tamanho | concluída | classes e atributos verificados |
| 3.1 — atualizar documentação da feature | concluída | README revisado |
| 3.2 — lint, build e OpenSpec | concluída | todos aprovados |
| 3.3 — inspeção visual manual | pendente | não havia navegador disponível no CUA |

A implementação de código e as verificações automatizadas estão concluídas. A change não deve ser arquivada enquanto a inspeção visual manual não for executada ou formalmente dispensada.

## 3. Arquivos modificados

| Arquivo | Alteração |
| --- | --- |
| <code>src/features/appointments/model/weekly-grid.ts</code> | Limite compartilhado da grade passou de 18 para 20. |
| <code>src/features/appointments/pages/appointments-page.tsx</code> | Linhas, marcador terminal, altura da matriz, âncora e estilo do botão foram atualizados. |
| <code>src/features/appointments/__tests__/weekly-grid.test.ts</code> | Teste das constantes 20:00 e 1200 minutos. |
| <code>src/features/appointments/__tests__/appointments-page.integration.test.tsx</code> | Teste do marcador 20:00 e de cartão às 19:30. |
| <code>src/features/appointments/__tests__/current-hour-action.integration.test.tsx</code> | Teste de posição, estilo e ausência fora da janela. |
| <code>src/features/appointments/README.md</code> | Documentação do novo intervalo e da nova posição do botão. |
| <code>openspec/changes/ajustar-grade-horaria-e-botao-atual/tasks.md</code> | Tarefas executadas marcadas como concluídas, exceto a inspeção visual. |

## 4. Como era antes

### 4.1. Limite do modelo

~~~ts
export const WEEK_GRID_START_HOUR = 7
export const WEEK_GRID_END_HOUR = 18
export const WEEK_GRID_HOUR_MINUTES = 60
export const WEEK_GRID_START_MINUTES = WEEK_GRID_START_HOUR * 60
export const WEEK_GRID_END_MINUTES = WEEK_GRID_END_HOUR * 60
~~~

O modelo informava 18 como limite. A página usava essa constante para decidir a altura mínima da agenda e para limitar a localização de grupos de agendamentos.

### 4.2. Quantidade de linhas

~~~tsx
const hourLabels = Array.from(
  { length: WEEK_GRID_END_HOUR - WEEK_GRID_START_HOUR + 1 },
  (_, index) => WEEK_GRID_START_HOUR + index,
)
~~~

Com o limite 18, a lista continha as horas 07 até 18. Essa construção tratava o limite terminal como se também fosse uma linha completa, o que poderia representar visualmente uma faixa posterior ao limite.

### 4.3. Posição antiga do botão

~~~tsx
<div
  ref={actionContainerRef}
  className="absolute right-2 z-[4]"
  style={{
    top: currentRowTopPx,
  }}
>
~~~

No código real, currentRowTopPx era calculado a partir de currentRow.topPx. O deslocamento horizontal right-2 mantinha o botão dentro da coluna atual, sem relacioná-lo à borda entre as colunas.

### 4.4. Estilo antigo

~~~tsx
<Button
  type="button"
  data-testid="start-current-hour-toggle"
  ref={actionToggleRef}
  aria-label="Ações da hora corrente"
  aria-expanded={expandedHourKey === actionKey}
  onClick={toggleCurrentHourAction}
  className="size-14 rounded-full bg-[#08a45d] p-0 text-white shadow-[0_10px_22px_rgb(4_92_57_/_30%)] hover:bg-[#078f58] focus-visible:ring-[#08a45d]"
>
  <Plus aria-hidden="true" className="size-8" />
</Button>
~~~

O tamanho era 56 px, a cor principal era verde e o ícone tinha 32 px.

### 4.5. Teste antigo da régua

~~~tsx
expect(
  within(weeklyGrid).getByTestId('weekly-appointments-time-ruler'),
).toHaveTextContent('18:00')
~~~

### 4.6. README antigo

~~~md
Na célula da data corrente e da hora corrente da unidade, a agenda exibe um
botão flutuante verde com +. A hora é calculada pelo fuso IANA retornado no
catálogo da unidade, e não pelo fuso do navegador.
~~~

## 5. Implementação passo a passo

### 5.1. Alteração da constante central

A primeira alteração foi feita em <code>weekly-grid.ts</code>:

~~~diff
 export const WEEK_GRID_START_HOUR = 7
-export const WEEK_GRID_END_HOUR = 18
+export const WEEK_GRID_END_HOUR = 20
 export const WEEK_GRID_HOUR_MINUTES = 60
 export const WEEK_GRID_START_MINUTES = WEEK_GRID_START_HOUR * 60
 export const WEEK_GRID_END_MINUTES = WEEK_GRID_END_HOUR * 60
~~~

Estado atual:

~~~ts
export const WEEK_GRID_START_HOUR = 7
export const WEEK_GRID_END_HOUR = 20
export const WEEK_GRID_HOUR_MINUTES = 60
export const WEEK_GRID_START_MINUTES = WEEK_GRID_START_HOUR * 60
export const WEEK_GRID_END_MINUTES = WEEK_GRID_END_HOUR * 60
~~~

A consequência numérica é:

~~~text
WEEK_GRID_END_HOUR = 20
WEEK_GRID_END_MINUTES = 20 * 60 = 1200
~~~

A constante continua sendo a fonte de verdade para a página. Nenhum número alternativo foi introduzido no componente.

### 5.2. Linhas efetivas de 07:00 a 20:00

A construção atual remove o + 1:

~~~tsx
const hourLabels = Array.from(
  { length: WEEK_GRID_END_HOUR - WEEK_GRID_START_HOUR },
  (_, index) => WEEK_GRID_START_HOUR + index,
)
~~~

Com início 7 e fim 20, as linhas efetivas são:

~~~text
07:00–08:00
08:00–09:00
09:00–10:00
10:00–11:00
11:00–12:00
12:00–13:00
13:00–14:00
14:00–15:00
15:00–16:00
16:00–17:00
17:00–18:00
18:00–19:00
19:00–20:00
~~~

O rótulo terminal 20:00 não é uma linha adicional. Ele é desenhado no final da régua:

~~~tsx
<div
  data-hour={WEEK_GRID_END_HOUR}
  data-terminal="true"
  className="pointer-events-none absolute inset-x-0 h-0"
  style={{ top: gridHeightPx }}
>
  <time className="relative -top-2 inline-block bg-[#f8fbfd] pl-1">
    endHourLabel
  </time>
</div>
~~~

No código renderizado, endHourLabel é produzido com String(WEEK_GRID_END_HOUR).padStart(2, '0') + ':00' e top é convertido para pixels.

Esse desenho evita criar uma faixa 20:00–21:00. Ao mesmo tempo, mantém 20:00 visível como limite final para a pessoa usuária.

### 5.3. Altura real da matriz

A soma das linhas foi extraída para gridHeightPx:

~~~tsx
const gridHeightPx = visualHourRows.reduce(
  (total, row) => total + row.heightPx,
  0,
)
~~~

O cálculo completo atual é:

~~~tsx
const maxAppointmentEndPx = visualWeeklyGrid
  .flatMap((day) => day.appointments)
  .reduce(
    (latest, appointment) =>
      Math.max(latest, appointment.visualTopPx + appointment.visualHeightPx),
    (WEEK_GRID_END_MINUTES - WEEK_GRID_START_HOUR * 60) * MINUTE_HEIGHT_PX,
  )

const matrixHeight = Math.max(
  gridHeightPx,
  maxAppointmentEndPx,
)
~~~

Diferença entre os valores:

- gridHeightPx é a altura das linhas horárias, incluindo linhas ampliadas por sobreposição;
- maxAppointmentEndPx é a maior posição final de cartão;
- matrixHeight usa o maior dos dois para não cortar cartões fora da janela;
- o marcador 20:00 usa gridHeightPx, e não o final de um cartão posterior, para continuar representando o limite da régua.

A régua recebe minHeight igual à matriz:

~~~tsx
<div
  data-testid="weekly-appointments-time-ruler"
  aria-label="Régua de horários da agenda"
  className="relative border-r border-[#dfe9ef] bg-[#f8fbfd] text-right text-xs font-semibold text-[#53657a]"
  style={{ minHeight: matrixHeight }}
>
~~~

A aplicação real converte matrixHeight para uma string com unidade px.

### 5.4. Âncora horizontal do botão

A página percorre a grade com dayIndex e calcula se há uma coluna seguinte:

~~~tsx
const hasNextDay = dayIndex < visualWeeklyGrid.length - 1
const actionAnchor = hasNextDay
  ? 'next-day-divider'
  : 'current-day-edge'
~~~

O contêiner atual:

~~~tsx
<div
  ref={actionContainerRef}
  data-testid="start-current-hour-container"
  data-action-anchor={actionAnchor}
  className="absolute right-0 z-[4]"
  style={{
    top: currentRowTopPx,
    transform: hasNextDay
      ? 'translateX(50%)'
      : undefined,
  }}
>
~~~

No código real, currentRowTopPx corresponde a Math.max(currentRow.topPx + 6, 4) + 'px'.

#### Coluna com próximo dia

Quando a coluna atual tem uma próxima coluna à direita:

~~~text
dia atual                 próximo dia
                    |     |
                    |  +  |
                    |     |
~~~

right-0 coloca o contêiner na borda direita do dia atual. translateX(50%) desloca o contêiner metade da sua largura para a próxima coluna. O centro do círculo passa a coincidir com a linha divisória.

#### Última coluna

Quando não existe uma próxima coluna, hasNextDay é falso. O transform não é aplicado e o botão permanece dentro da última coluna. Isso evita que o controle ultrapasse a área rolável.

#### Eixo vertical

A posição vertical continua baseada na linha corrente:

~~~tsx
top: currentRowTopPx
~~~

Como currentRow é obtido de visualHourRows, o botão acompanha a altura dinâmica de uma linha que tenha cartões simultâneos.

### 5.5. Alinhamento do menu expandido

Antes, o menu usava right-0:

~~~tsx
className="absolute right-0 bottom-[calc(100%+0.5rem)] h-10 whitespace-nowrap rounded-full bg-[#078f58] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgb(4_92_57_/_28%)] hover:bg-[#057949] focus-visible:ring-[#078f58]"
~~~

Agora ele é centralizado no mesmo eixo:

~~~tsx
className="absolute right-1/2 bottom-[calc(100%+0.5rem)] h-10 translate-x-1/2 whitespace-nowrap rounded-full bg-[#078f58] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgb(4_92_57_/_28%)] hover:bg-[#057949] focus-visible:ring-[#078f58]"
~~~

A ação Iniciar todos continua verde de propósito. A change alterou a apresentação do botão +; o menu e a mutação permanecem no escopo anterior.

### 5.6. Nova apresentação visual do botão

Estado atual:

~~~tsx
<Button
  type="button"
  data-testid="start-current-hour-toggle"
  data-button-color="#6F3CFF"
  data-button-size="53px"
  ref={actionToggleRef}
  aria-label="Ações da hora corrente"
  aria-expanded={expandedHourKey === actionKey}
  onClick={toggleCurrentHourAction}
  className="size-[53px] rounded-full bg-[#6F3CFF]/80 p-0 text-white shadow-[0_10px_22px_rgb(111_60_255_/_24%)] hover:bg-[#6F3CFF]/90 focus-visible:ring-[#6F3CFF]"
>
  <Plus aria-hidden="true" className="size-7" />
</Button>
~~~

O código real mantém a construção dinâmica do aria-label e o onClick inline existente. A troca principal está nas classes e nos atributos de teste.

Explicação:

- size-14, que equivalia a 56 px, foi substituído por size-[53px];
- bg-[#6F3CFF]/80 aplica o matiz solicitado com transparência;
- hover:bg-[#6F3CFF]/90 aumenta a presença no hover mantendo o roxo;
- focus-visible:ring-[#6F3CFF] mantém foco visível;
- a sombra usa RGB equivalente a 111, 60, 255, que é #6F3CFF;
- o ícone passa de size-8 para size-7;
- 53 px continua acima do alvo de interação de 44 px;
- aria-expanded e aria-label permanecem;
- stopPropagation continua impedindo que o clique abra o cartão do paciente;
- o comportamento de Escape, clique fora e envio permanece inalterado.

Os atributos data-button-color e data-button-size tornam a intenção visual verificável nos testes.

### 5.7. Hora fora da janela

A renderização procura a linha da hora corrente:

~~~tsx
const currentRow = currentHour
  ? visualHourRows.find((row) => row.hour === currentHour.hour)
  : undefined

const isCurrentHourDay =
  currentHour?.dateKey === day.key && currentRow !== undefined
~~~

O botão somente entra no DOM quando os três valores são válidos:

~~~tsx
{isCurrentHourDay && currentRow && currentHour ? (
  <div>{/* ação da hora corrente */}</div>
) : null}
~~~

Como visualHourRows contém 07 até 19, uma hora local 20:00 ou posterior não possui currentRow. Portanto, o botão não é deslocado para outro dia ou horário.

## 6. Testes

### 6.1. Teste do limite numérico

Importações novas:

~~~tsx
WEEK_GRID_END_HOUR,
WEEK_GRID_END_MINUTES,
~~~

Teste adicionado:

~~~tsx
it('mantém a janela visual estendida até 20:00', () => {
  expect(WEEK_GRID_END_HOUR).toBe(20)
  expect(WEEK_GRID_END_MINUTES).toBe(20 * 60)
})
~~~

Esse teste protege a fonte de verdade do modelo.

### 6.2. Teste de 20:00 e de 19:30

O teste de integração acrescenta:

~~~tsx
{
  ...createdAppointment,
  id: 'appointment-near-grid-end',
  startsAt: '2026-08-13T23:30:00.000Z',
  durationMinutes: 30,
}
~~~

Como o fixture usa America/Cuiaba:

~~~text
2026-08-13T23:30:00.000Z = 19:30 local
~~~

A posição esperada é:

~~~text
(19 * 60 + 30) - (7 * 60) = 750 minutos
~~~

As asserções novas:

~~~tsx
expect(
  within(weeklyGrid).getByTestId('weekly-appointments-time-ruler'),
).toHaveTextContent('20:00')

expect(
  within(weeklyGrid).getByTestId('appointment-appointment-near-grid-end'),
).toHaveAttribute('data-top-minutes', '750')
~~~

Isso prova que o limite textual aparece e que um cartão próximo do novo final continua sendo posicionado.

### 6.3. Teste da âncora e do estilo

~~~tsx
const container = await screen.findByTestId('start-current-hour-container')
expect(container).toHaveAttribute('data-action-anchor', 'next-day-divider')
expect(container).toHaveStyle({ transform: 'translateX(50%)' })

const toggle = await screen.findByTestId('start-current-hour-toggle')
expect(toggle).toHaveAttribute('data-button-color', '#6F3CFF')
expect(toggle).toHaveAttribute('data-button-size', '53px')
expect(toggle).toHaveClass(
  'size-[53px]',
  'bg-[#6F3CFF]/80',
  'hover:bg-[#6F3CFF]/90',
  'focus-visible:ring-[#6F3CFF]',
)
~~~

O teste continua clicando no botão, abrindo Iniciar todos e verificando a requisição única:

~~~tsx
await user.click(toggle)
expect(screen.getByTestId('start-current-hour-action')).toBeVisible()

await user.click(screen.getByTestId('start-current-hour-action'))

await waitFor(() =>
  expect(apiScenario.startCurrentHourRequests).toEqual([
    {
      unitId: 'unit-a',
      hourStart: '2026-08-13T16:00:00.000Z',
    },
  ]),
)
~~~

### 6.4. Teste de ausência depois das 20:00

~~~tsx
it('não exibe a ação quando a hora corrente já ultrapassou o limite da grade', async () => {
  vi.setSystemTime(new Date('2026-08-14T00:30:00.000Z'))

  renderWithProviders(
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/appointments" element={<AppointmentsPage />} />
      </Route>
    </Routes>,
  )

  await screen.findByTestId('weekly-appointments')
  expect(
    screen.queryByTestId('start-current-hour-toggle'),
  ).not.toBeInTheDocument()
})
~~~

Em America/Cuiaba, o instante utilizado representa 20:30 local. A ação não aparece.

### 6.5. Comportamentos preservados

Os testes anteriores continuam cobrindo:

- abertura por clique;
- uma única chamada coletiva;
- mudança confirmada para ATENDENDO;
- fechamento com Escape;
- retorno do foco ao botão +;
- fechamento ao clicar fora;
- ausência de propagação do evento para cartões.

## 7. Contrato HTTP e fluxo de negócio preservados

A change não modificou o endpoint:

~~~ts
startCurrentHour: builder.mutation<
  StartCurrentHourResponse,
  StartCurrentHourInput
>({
  query: (data) => ({
    url: '/api/appointments/start-current-hour',
    method: 'POST',
    data,
  }),
  invalidatesTags: [{ type: 'Appointment', id: 'LIST' }],
}),
~~~

O payload continua sendo:

~~~ts
export interface StartCurrentHourInput {
  unitId: string
  hourStart: string
}
~~~

O envio continua usando:

~~~tsx
const result = await startCurrentHour({
  unitId: session.activeUnitId,
  hourStart: currentHour.hourStart,
}).unwrap()
~~~

Após a confirmação:

1. o contexto da ação é comparado;
2. a opção é fechada;
3. a lista de agendamentos é consultada novamente;
4. o feedback informa quantos atendimentos foram iniciados ou ignorados;
5. erros permanecem tratados sem atualização otimista;
6. não há chamadas individuais como fallback.

A API continua sendo a autoridade para presença, conflitos, autorização, integridade e estados persistidos.

## 8. README atualizado

O fluxo principal passou a mencionar a nova régua:

~~~md
dias úteis em uma matriz com régua de 07:00 a 20:00.
~~~

A seção da ação corrente passou de verde para roxo translúcido e passou a explicar a ancoragem:

~~~md
botão flutuante roxo translúcido com +, usando #6F3CFF e aproximadamente
53 px de diâmetro. Quando houver uma próxima coluna visível, o centro do botão
fica sobre a linha divisória entre o dia atual e o próximo; na última coluna,
ele permanece ancorado à borda interna do dia.
~~~

O README ainda documenta fuso IANA, endpoint, estados elegíveis, atualização após sucesso, falhas, Escape e fechamento por clique fora.

## 9. Verificações executadas

### Testes direcionados

~~~bash
npm run test -- src/features/appointments/__tests__/weekly-grid.test.ts --run
~~~

Resultado:

~~~text
Test Files  1 passed (1)
Tests       5 passed (5)
~~~

~~~bash
npm run test -- \
  src/features/appointments/__tests__/weekly-grid.test.ts \
  src/features/appointments/__tests__/appointments-page.integration.test.tsx \
  --run
~~~

Resultado:

~~~text
Test Files  2 passed (2)
Tests       31 passed (31)
~~~

~~~bash
npm run test -- src/features/appointments/__tests__/current-hour-action.integration.test.tsx --run
~~~

Resultado:

~~~text
Test Files  1 passed (1)
Tests       4 passed (4)
~~~

### Suíte completa

~~~bash
npm run test -- --run
~~~

Resultado:

~~~text
Test Files  24 passed (24)
Tests       168 passed (168)
~~~

### Lint, build e validação OpenSpec

~~~bash
npm run lint
npm run build
openspec validate ajustar-grade-horaria-e-botao-atual --strict
git diff --check
~~~

Resultados:

- lint aprovado;
- build aprovado;
- validação OpenSpec estrita aprovada;
- diff sem erros de whitespace.

O build apresentou somente o aviso do Vite sobre chunks maiores que 500 kB após minificação. Não houve erro de TypeScript ou empacotamento.

## 10. Inspeção visual pendente

A tarefa 3.3 ainda precisa verificar manualmente:

- viewport larga;
- viewport estreita;
- centro do botão na linha divisória entre dias;
- rolagem horizontal;
- linha corrente com cartões simultâneos;
- fallback da última coluna;
- marcador 20:00;
- contraste do roxo translúcido;
- foco visível por teclado.

O servidor Vite respondeu em localhost:3001 durante a tentativa, mas o CUA informou que não havia navegador disponível para abrir a aplicação e capturar a tela. Por isso, essa tarefa não foi marcada como concluída com base apenas nos testes de DOM.

Em ambiente com navegador:

~~~bash
npm run dev -- --host 0.0.0.0
~~~

Abrir a URL informada pelo Vite, normalmente:

~~~text
http://localhost:3000/appointments
~~~

Se 3000 estiver ocupada, usar a porta indicada pelo processo. A inspeção pode ser feita sem executar Iniciar todos, pois não exige mutação de dados.

## 11. Encerramento técnico

A implementação atende aos requisitos de código, testes, documentação e validação automatizada. O contrato da API e o comportamento de negócio foram preservados.

O único item restante é a inspeção visual manual. Depois dela, registrar o resultado em tasks.md na tarefa 3.3, executar novamente:

~~~bash
openspec validate ajustar-grade-horaria-e-botao-atual --strict
~~~

e só então considerar a change pronta para revisão e eventual arquivamento.

