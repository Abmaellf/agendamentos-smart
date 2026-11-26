# Guia de implementação — `destacar-hora-corrente-e-botao-lote`

## 1. Objetivo

Este documento descreve, como um guia técnico para desenvolvedores, a implementação
da change `destacar-hora-corrente-e-botao-lote` no front-end da agenda semanal.

A solução final mantém o hover verde existente em toda a linha horária e adiciona
uma borda roxa somente na célula de dia + hora que está sob o cursor. A ação em
lote continua sendo acionada pelo botão `+`, agora como um botão simples, circular
e posicionado no canto inferior direito da área da hora corrente.

O documento registra a evolução do requisito, os arquivos envolvidos, o fluxo de
renderização, os trechos antes/depois, os testes, as validações e a pendência de
inspeção visual local.

## 2. Identificação

| Campo | Valor |
| --- | --- |
| Change | `destacar-hora-corrente-e-botao-lote` |
| Área | Front-end da agenda semanal |
| Componente principal | `AppointmentsPage` |
| Capability OpenSpec | `weekly-appointments` |
| Cor | `#6F3CFF` |
| Borda | `1px solid #6F3CFF` |
| Ação | `Iniciar todos` |
| Endpoint preservado | `POST /api/appointments/start-current-hour` |
| Estado | Código, testes, documentação e validação estrita concluídos; inspeção visual pendente |

Artefatos relacionados:

- [proposal.md](./proposal.md): motivação, escopo e impacto;
- [design.md](./design.md): decisões técnicas e alternativas;
- [spec delta](./specs/weekly-appointments/spec.md): requisitos e cenários;
- [tasks.md](./tasks.md): checklist da implementação.

## 3. Requisitos finais

### 3.1 Hover da grade

Quando o cursor está sobre uma combinação específica de dia e hora:

1. toda a linha horária continua com o hover verde existente;
2. somente a célula sob o cursor recebe `border: 1px solid #6F3CFF`;
3. as células dos demais dias não recebem a borda roxa;
4. o destaque desaparece ao sair da célula ou do cartão;
5. mover o cursor não chama a API, não muda status e não atualiza agendamentos.

No estado normal não existe linha roxa permanente envolvendo a faixa da hora
corrente.

### 3.2 Botão da hora corrente

O controle deve:

1. ficar no canto inferior direito do agrupamento da hora corrente;
2. ser um botão nativo e circular;
3. usar `border-radius: 50%`, representado por `rounded-full`;
4. exibir somente `+`, sem triângulo, diagonal, `clip-path` ou área triangular;
5. manter a cor `#6F3CFF` no ícone e nos estados de hover/foco;
6. continuar acessível por nome, teclado e foco visível;
7. abrir `Iniciar todos` sem alterar dados;
8. usar a operação de lote existente quando confirmado.

### 3.3 Escopo preservado

A mudança é visual e não altera o cálculo da hora, fuso da unidade, semana,
elegibilidade, endpoint, payload, permissões, status ou fluxo de confirmação.
O backend continua sendo a autoridade para autorização, seleção definitiva e
mudança de status.

## 4. Estado anterior e estado atual

### 4.1 Hover antes

Antes, o componente controlava apenas a hora:

```tsx
const [hoveredHour, setHoveredHour] = useState<number | null>(null)
```

Todas as colunas da mesma hora compartilhavam o estado. Os eventos da régua
eram equivalentes a:

```tsx
onMouseEnter={() => setHoveredHour(row.hour)}
onMouseLeave={() => setHoveredHour(null)}
onFocus={() => setHoveredHour(row.hour)}
onBlur={() => setHoveredHour(null)}
```

A camada de cada hora usava apenas o horário:

```tsx
<div
  data-hour={hour}
  data-hovered={hoveredHour === hour}
  onMouseEnter={() => setHoveredHour(hour)}
  onMouseLeave={() => setHoveredHour(null)}
  className={cn(
    'pointer-events-auto absolute inset-x-0 z-0 border-b border-transparent transition-colors',
    hoveredHour === hour && 'bg-[#dff7eb]/70',
  )}
/>
```

O `border-b` separava horizontalmente a grade, mas não criava uma borda
completa por célula nem distinguia um dia de outro.

### 4.2 Hover depois

O estado atual separa os dois escopos:

```tsx
const [hoveredHour, setHoveredHour] = useState<number | null>(null)
const [hoveredDayHour, setHoveredDayHour] = useState<string | null>(null)
```

- `hoveredHour` continua controlando o hover verde da linha inteira;
- `hoveredDayHour` controla somente a borda roxa da célula selecionada.

A chave é composta pelo dia e pela hora:

```tsx
const cellKey = ${day.key}-${hour}
```

Exemplos de chaves:

```text
2026-08-10-7
2026-08-10-8
2026-08-11-7
```

Assim, `07:00` em uma coluna não é confundido com `07:00` em outra.

### 4.3 Arquivos envolvidos

| Arquivo | Responsabilidade |
| --- | --- |
| [src/features/appointments/pages/appointments-page.tsx](../../../src/features/appointments/pages/appointments-page.tsx) | Renderiza a grade, estados de hover, agrupamento e botão. |
| [src/features/appointments/__tests__/appointments-page.integration.test.tsx](../../../src/features/appointments/__tests__/appointments-page.integration.test.tsx) | Testa a célula específica e o hover verde na linha. |
| [src/features/appointments/__tests__/current-hour-action.integration.test.tsx](../../../src/features/appointments/__tests__/current-hour-action.integration.test.tsx) | Testa agrupamento, botão, ausência do triângulo e mutação. |
| [src/features/appointments/README.md](../../../src/features/appointments/README.md) | Documenta o comportamento da feature. |
| [spec delta](./specs/weekly-appointments/spec.md) | Formaliza os requisitos. |
| [design.md](./design.md) | Registra decisões e riscos. |
| [tasks.md](./tasks.md) | Registra o andamento. |

## 5. Fluxo técnico da tela

```text
AppointmentsPage
  ├─ consulta sessão, unidade e agendamentos
  ├─ calcula a hora corrente no fuso IANA da unidade
  ├─ cria a grade com buildWeeklyAppointmentGrid
  ├─ cria a geometria com buildVisualAppointmentLayout
  ├─ renderiza uma section por dia
  │   ├─ camada de hover por dia + hora
  │   ├─ moldura da hora corrente quando há cartões
  │   ├─ botão + no canto inferior direito
  │   └─ cartões individuais
  └─ mantém startCurrentHour para a ação confirmada
```

A geometria existente continua sendo a fonte de posicionamento. Para o
agrupamento corrente, são usados o topo da linha, o fim normal da linha e o
maior limite inferior dos cartões posicionados naquela hora. Isso permite que
cartões simultâneos expandam a área sem desalinhar moldura ou botão.

## 6. Implementação passo a passo

### Passo 1 — Constante de ancoragem

Foi adicionada:

```tsx
const DEFAULT_DAY_COLUMN_WIDTH_PX = 320
const CURRENT_HOUR_ACTION_CORNER_SIZE_PX = 72
```

O botão mede 48 px com `size-12`. O contêiner de 72 px fornece área previsível
para posicionamento sem alterar a largura da coluna.

### Passo 2 — Estado granular

```tsx
const [hoveredHour, setHoveredHour] = useState<number | null>(null)
const [hoveredDayHour, setHoveredDayHour] = useState<string | null>(null)
```

A relação é:

```text
hoveredHour     -> todas as colunas da mesma hora -> fundo verde
hoveredDayHour  -> uma coluna e uma hora           -> borda roxa
```

Se apenas o estado granular fosse usado, o verde seria perdido. Se apenas
`hoveredHour` fosse usado, todas as células receberiam a borda roxa.

### Passo 3 — Régua e foco

A régua continua acessível por teclado. Ao entrar ou focar uma linha, o código
mantém o verde e limpa a seleção granular:

```tsx
<div
  key={row.hour}
  data-hour={row.hour}
  data-row-top={row.topPx}
  data-row-height={row.heightPx}
  data-hovered={hoveredHour === row.hour}
  tabIndex={0}
  onMouseEnter={() => {
    setHoveredHour(row.hour)
    setHoveredDayHour(null)
  }}
  onMouseLeave={() => {
    setHoveredHour(null)
    setHoveredDayHour(null)
  }}
  onFocus={() => {
    setHoveredHour(row.hour)
    setHoveredDayHour(null)
  }}
  onBlur={() => {
    setHoveredHour(null)
    setHoveredDayHour(null)
  }}
  className={cn(
    'relative border-b border-[#dfe9ef] pr-2 outline-none transition-colors',
    hoveredHour === row.hour && 'bg-[#dff7eb]',
  )}
  style={{ height: `${row.heightPx}px` }}
>
  {/* horário da régua */}
</div>
```

Antes, esses handlers alteravam apenas `hoveredHour`. A limpeza também evita
que uma borda antiga permaneça quando o foco sai da matriz.

### Passo 4 — Célula de dia + hora

Dentro de cada coluna, a grade percorre `hourLabels` e calcula uma chave:

```tsx
{hourLabels.map((hour) =>
  (() => {
    const row = visualHourRows.find((item) => item.hour === hour)
    const cellKey = `${day.key}-${hour}`

    return (
      <div
        key={hour}
        data-hour={hour}
        data-row-top={row?.topPx}
        data-row-height={row?.heightPx}
        data-hovered={hoveredDayHour === cellKey}
        aria-hidden="true"
        onMouseEnter={() => {
          setHoveredHour(hour)
          setHoveredDayHour(cellKey)
        }}
        onMouseLeave={() => {
          setHoveredHour(null)
          setHoveredDayHour(null)
        }}
        className={cn(
          'pointer-events-auto absolute inset-x-0 z-0 border border-transparent transition-colors',
          hoveredHour === hour && 'bg-[#dff7eb]/70',
          hoveredDayHour === cellKey && 'border-[#6F3CFF]',
        )}
        style={{
          top: `${row?.topPx ?? (hour - WEEK_GRID_START_HOUR) * HOUR_HEIGHT_PX}px`,
          height: `${row?.heightPx ?? HOUR_HEIGHT_PX}px`,
        }}
      />
    )
  })(),
)}
```

Detalhamento:

- `data-hour` mantém a célula consultável nos testes;
- `data-row-top` e `data-row-height` expõem a geometria;
- `data-hovered` representa uma única combinação;
- `aria-hidden` evita anunciar a camada visual como controle;
- `border border-transparent` reserva 1 px no estado normal;
- `border-[#6F3CFF]` aparece somente para a célula ativa;
- `bg-[#dff7eb]/70` mantém o verde na mesma hora;
- `pointer-events-auto` permite registrar o ponteiro.

A borda transparente evita alteração de geometria quando o hover aparece.

### Passo 5 — Hover sobre os cartões

O cartão fica acima da camada de célula. Por isso, seus handlers também atualizam
os dois estados:

```tsx
onMouseEnter={() => {
  setHoveredHour(appointmentHour)
  setHoveredDayHour(
    `${positioned.dateKey}-${appointmentHour}`,
  )
}}
onMouseLeave={() => {
  setHoveredHour(null)
  setHoveredDayHour(null)
}}
```

Antes:

```tsx
onMouseEnter={() => setHoveredHour(appointmentHour)}
onMouseLeave={() => setHoveredHour(null)}
```

O clique e o teclado continuam abrindo detalhes:

```tsx
onClick={() => openAppointmentDetails(positioned.appointment)}
onKeyDown={(event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    openAppointmentDetails(positioned.appointment)
  }
}}
```

A camada visual não substitui a seleção do paciente.

### Passo 6 — Agrupamento corrente

Os cartões pertencentes ao dia e à hora corrente são filtrados:

```tsx
const currentHourAppointments =
  isCurrentHourDay && currentHour
    ? day.appointments.filter(
        (appointment) =>
          Math.floor(appointment.startMinutes / 60) === currentHour.hour,
      )
    : []
```

O agrupamento só existe quando data e hora correspondem ao contexto corrente e
há pelo menos um cartão.

O limite inferior considera a linha e os cartões:

```tsx
const currentHourGroupBottomPx =
  isCurrentHourDay && currentRow
    ? Math.max(
        currentRow.topPx + currentRow.heightPx,
        ...currentHourAppointments.map(
          (appointment) =>
            appointment.visualTopPx + appointment.visualHeightPx,
        ),
      )
    : 0
```

Isso evita altura fixa quando cartões simultâneos expandem a faixa.

### Passo 7 — Moldura visual

```tsx
{isCurrentHourDay &&
currentRow &&
currentHour &&
currentHourAppointments.length > 0 ? (
  <div
    aria-hidden="true"
    data-testid="current-hour-appointment-group"
    data-day={day.key}
    data-hour={currentHour.hour}
    data-appointment-count={currentHourAppointments.length}
    data-hovered={
      hoveredDayHour === `${day.key}-${currentHour.hour}`
    }
    className={cn(
      'pointer-events-none absolute inset-x-0 z-[1] border border-transparent transition-[border-color,box-shadow,filter] duration-[160ms]',
      hoveredDayHour === `${day.key}-${currentHour.hour}` &&
        'border-[#6F3CFF] shadow-[0_0_0_1px_rgb(111_60_255_/_28%)]',
    )}
    style={{
      top: `${currentRow.topPx}px`,
      height: `${currentHourGroupBottomPx - currentRow.topPx}px`,
    }}
  />
) : null}
```

A moldura usa `pointer-events-none` porque é apresentação. Ela não pode
bloquear clique, foco ou hover do cartão abaixo.

No repouso, usa `border-transparent`. No hover da combinação corrente, usa
`border-[#6F3CFF]`. A sombra discreta reforça o contraste sem criar linha
permanente.

### Passo 8 — Reposicionamento do contêiner

Antes, a posição dependia da próxima coluna:

```tsx
const hasNextDay = dayIndex < visualWeeklyGrid.length - 1
const actionAnchor = hasNextDay
  ? 'next-day-divider'
  : 'current-day-edge'
```

```tsx
<div
  data-action-anchor={actionAnchor}
  className="absolute right-0 z-[4]"
  style={{
    top: `${Math.max(currentRow.topPx + 6, 4)}px`,
    transform: hasNextDay ? 'translateX(50%)' : undefined,
  }}
>
```

Esse desenho usava a divisória ou o topo. Agora o contêiner acompanha o canto
inferior direito do agrupamento:

```tsx
<div
  ref={actionContainerRef}
  data-testid="start-current-hour-container"
  data-action-anchor="current-hour-group-bottom-right"
  className="pointer-events-none absolute right-0 z-[4] size-[72px]"
  style={{
    top: `${Math.max(
      currentRow.topPx,
      currentHourGroupBottomPx - CURRENT_HOUR_ACTION_CORNER_SIZE_PX,
    )}px`,
  }}
>
```

O cálculo é:

```text
top = maior valor entre:
      topo da linha corrente
      limite inferior do agrupamento - 72 px
```

`Math.max` evita ultrapassar o início da faixa. `right-0` mantém a área presa
à borda direita da coluna, inclusive quando é a última coluna visível.

### Passo 9 — Remoção do triângulo

A composição triangular deixou de existir. Não há mais diagonal, `clip-path`,
`clipPath`, pseudo-elemento, área triangular, `start-current-hour-triangle`
ou `data-button-shape`.

O teste garante:

```tsx
expect(
  screen.queryByTestId('start-current-hour-triangle'),
).not.toBeInTheDocument()
```

### Passo 10 — Botão circular simples

```tsx
<Button
  type="button"
  data-testid="start-current-hour-toggle"
  data-button-color="#6F3CFF"
  ref={actionToggleRef}
  aria-label={`Ações da hora ${String(currentHour.hour).padStart(2, '0')}:00`}
  aria-expanded={expandedHourKey === actionKey}
  onClick={(event) => {
    event.stopPropagation()
    setExpandedHourKey((current) =>
      current === actionKey ? null : actionKey,
    )
  }}
  className="pointer-events-auto absolute right-0 bottom-0 size-12 rounded-full bg-transparent p-0 text-[#6F3CFF] shadow-none hover:bg-[#6F3CFF]/10 focus-visible:ring-[#6F3CFF]"
>
  <Plus
    aria-hidden="true"
    className="size-8 stroke-[1.5]"
  />
</Button>
```

Antes, o botão tinha 53 px, fundo roxo e sombra:

```tsx
<Button
  data-testid="start-current-hour-toggle"
  data-button-color="#6F3CFF"
  data-button-size="53px"
  className="size-[53px] rounded-full bg-[#6F3CFF]/80 p-0 text-white shadow-[0_10px_22px_rgb(111_60_255_/_24%)] hover:bg-[#6F3CFF]/90 focus-visible:ring-[#6F3CFF]"
>
  <Plus aria-hidden="true" className="size-7" />
</Button>
```

Mudanças:

- removeu-se `data-button-size="53px"`;
- `size-12` define 48 px;
- `rounded-full` representa `border-radius: 50%`;
- o fundo normal é transparente;
- `text-[#6F3CFF]` colore o sinal;
- `hover:bg-[#6F3CFF]/10` cria resposta sutil;
- `focus-visible:ring-[#6F3CFF]` mantém foco;
- `shadow-none` remove a sombra pesada;
- `size-8 stroke-[1.5]` deixa o sinal legível.

O pai usa `pointer-events-none`, portanto botão e opção expandida usam
`pointer-events-auto`.

### Passo 11 — Opção Iniciar todos

A opção continua acima do botão:

```tsx
{expandedHourKey === actionKey ? (
  <Button
    type="button"
    data-testid="start-current-hour-action"
    disabled={
      eligibleCount === 0 ||
      startCurrentHourState.isLoading
    }
    onClick={(event) => {
      event.stopPropagation()
      void startAllInCurrentHour()
    }}
    className="pointer-events-auto absolute right-1/2 bottom-[calc(100%+0.5rem)] h-10 translate-x-1/2 whitespace-nowrap rounded-full bg-[#078f58] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgb(4_92_57_/_28%)] hover:bg-[#057949] focus-visible:ring-[#078f58]"
    aria-label={`Iniciar todos os agendamentos de ${currentHour.hour}:00 nesta unidade`}
  >
    {startCurrentHourState.isLoading
      ? 'Iniciando...'
      : 'Iniciar todos'}
  </Button>
) : null}
```

O fluxo de abertura e confirmação permanece igual. Quando não há elegíveis ou a
mutação está carregando, a opção fica desabilitada:

```tsx
disabled={
  eligibleCount === 0 ||
  startCurrentHourState.isLoading
}
```

A mensagem continua disponível:

```tsx
{eligibleCount === 0 ? (
  <span className="sr-only">
    Nenhum agendamento para iniciar nesta faixa
  </span>
) : null}
```

## 7. Contrato da atualização em lote

O hover e a moldura não fazem chamadas. A chamada só ocorre depois de abrir `+`
e confirmar `Iniciar todos`:

```text
POST /api/appointments/start-current-hour
```

Payload preservado:

```json
{
  "unitId": "unit-a",
  "hourStart": "2026-08-13T16:00:00.000Z"
}
```

O front-end não envia IDs individuais e não faz uma requisição por cartão.

Regras preservadas:

- `AGENDADO` e `FALTA` podem virar `ATENDENDO`;
- `CANCELADO`, `FINALIZADO` e demais estados não elegíveis são preservados;
- agendamentos de outra hora não são alterados;
- a agenda é atualizada depois do sucesso;
- falhas não geram atualização otimista;
- abrir, mover ou sair não envia nada.

A hora continua sendo calculada por
`getCurrentHourContext(clockNow, activeUnit.timeZone)`, isto é, pelo fuso da
unidade e não necessariamente pelo navegador.

## 8. Testes implementados

### 8.1 Botão e chamada única

```tsx
const container = await screen.findByTestId(
  'start-current-hour-container',
)

expect(container).toHaveAttribute(
  'data-action-anchor',
  'current-hour-group-bottom-right',
)
expect(container).toHaveClass('size-[72px]', 'pointer-events-none')

const toggle = await screen.findByTestId(
  'start-current-hour-toggle',
)

expect(toggle).toHaveAttribute('data-button-color', '#6F3CFF')
expect(toggle).not.toHaveAttribute('data-button-shape')
expect(toggle).toHaveClass(
  'size-12',
  'rounded-full',
  'text-[#6F3CFF]',
  'hover:bg-[#6F3CFF]/10',
  'focus-visible:ring-[#6F3CFF]',
)
expect(
  screen.queryByTestId('start-current-hour-triangle'),
).not.toBeInTheDocument()
```

Depois, o teste abre e confirma a ação, esperando uma única requisição:

```tsx
expect(apiScenario.startCurrentHourRequests).toEqual([
  {
    unitId: 'unit-a',
    hourStart: '2026-08-13T16:00:00.000Z',
  },
])
```

Também confirma status `ATENDENDO` e feedback de sucesso.

### 8.2 Agrupamento e hover

Com dois cartões na hora corrente e um terceiro na hora seguinte:

```tsx
expect(group).toHaveAttribute('data-day', '2026-08-13')
expect(group).toHaveAttribute('data-hour', '12')
expect(group).toHaveAttribute('data-appointment-count', '2')
expect(group).toHaveClass('border', 'border-transparent')
```

Ao entrar:

```tsx
fireEvent.mouseEnter(currentHourRow)
expect(group).toHaveAttribute('data-hovered', 'true')
expect(group).toHaveClass('border-[#6F3CFF]')
expect(apiScenario.startCurrentHourRequests).toHaveLength(0)
```

Ao sair, retorna para `border-transparent`. Isso prova que hover é visual.

### 8.3 Elegibilidade

O resultado esperado do cenário misto é:

```text
hora corrente + AGENDADO -> ATENDENDO
hora corrente + CANCELADO -> CANCELADO
hora seguinte + AGENDADO -> AGENDADO
```

### 8.4 Ausência de elegíveis

```tsx
await user.click(
  await screen.findByTestId('start-current-hour-toggle'),
)
expect(
  screen.getByTestId('start-current-hour-action'),
).toBeDisabled()
expect(
  screen.getByText('Nenhum agendamento para iniciar nesta faixa'),
).toBeInTheDocument()
expect(apiScenario.startCurrentHourRequests).toHaveLength(0)
```

### 8.5 Célula específica da grade

O teste compara segunda-feira e terça-feira às `07:00`:

```tsx
const mondayCell = weeklyGrid.querySelector(
  '[data-testid="appointments-day-2026-08-10"] [data-hour="7"]',
) as HTMLElement
const tuesdayCell = weeklyGrid.querySelector(
  '[data-testid="appointments-day-2026-08-11"] [data-hour="7"]',
) as HTMLElement

fireEvent.mouseEnter(mondayCell)

expect(mondayCell).toHaveAttribute('data-hovered', 'true')
expect(mondayCell).toHaveClass('border-[#6F3CFF]')
expect(mondayCell).toHaveClass('bg-[#dff7eb]/70')
expect(tuesdayCell).toHaveAttribute('data-hovered', 'false')
expect(tuesdayCell).toHaveClass('border-transparent')
expect(tuesdayCell).toHaveClass('bg-[#dff7eb]/70')
```

A linha continua verde nas outras colunas, mas a borda roxa aparece somente na
célula selecionada. Ao sair:

```tsx
fireEvent.mouseLeave(mondayCell)
expect(mondayCell).toHaveAttribute('data-hovered', 'false')
expect(mondayCell).toHaveClass('border-transparent')
expect(mondayCell).not.toHaveClass('bg-[#dff7eb]/70')
```

### 8.6 Hover sobre cartão

```tsx
fireEvent.mouseEnter(card)
expect(cardCell).toHaveAttribute('data-hovered', 'true')
expect(cardCell).toHaveClass('border-[#6F3CFF]')
expect(cardCell).toHaveClass('bg-[#dff7eb]/70')

fireEvent.mouseLeave(card)
expect(cardCell).toHaveAttribute('data-hovered', 'false')
expect(cardCell).toHaveClass('border-transparent')
```

## 9. Acessibilidade

O botão mantém semântica nativa, nome e foco:

```tsx
aria-label={`Ações da hora ${String(currentHour.hour).padStart(2, '0')}:00`}
aria-expanded={expandedHourKey === actionKey}
<Plus aria-hidden="true" />
```

O foco visível continua em:

```text
focus-visible:ring-[#6F3CFF]
```

As camadas de apresentação usam `aria-hidden="true"` e o cartão continua
interativo por clique, `Enter` e espaço. O agrupamento não cria uma segunda
ação semântica.

## 10. Decisões e alternativas descartadas

- Não desenhar a borda em cada cartão: a ação é da faixa, não de um paciente isolado.
- Não transformar a célula em botão: os cartões têm ação própria de detalhes.
- Não usar a imagem como implementação: HTML/CSS mantém responsividade e testes.
- Não manter diagonal ou triângulo: a decisão final foi somente o botão `+`.

## 11. Validações executadas

```bash
npm run test -- \
  src/features/appointments/__tests__/appointments-page.integration.test.tsx \
  src/features/appointments/__tests__/current-hour-action.integration.test.tsx
```

Resultado: 33 testes aprovados nos dois arquivos.

```bash
npm run lint
```

Resultado: lint aprovado.

```bash
npm run build
```

Resultado: build aprovado. O bundler mantém o aviso de chunks maiores que 500 kB;
isso não impediu a compilação.

```bash
git diff --check
```

Resultado: nenhuma inconsistência de whitespace.

```bash
openspec validate destacar-hora-corrente-e-botao-lote --strict
```

Resultado: validação estrita aprovada.

## 12. Documentação sincronizada

A seção `Iniciar atendimentos da hora corrente` em
[src/features/appointments/README.md](../../../src/features/appointments/README.md)
agora descreve a ausência de linha roxa no repouso, o hover verde da linha, a
borda `1px solid #6F3CFF` somente na célula, o botão circular sem triângulo,
a altura efetiva dos cartões simultâneos, o fuso IANA e a chamada única de lote.

Os artefatos OpenSpec também estão alinhados com o código: a spec formaliza o
destaque granular por célula e o botão circular no canto inferior direito.

## 13. Checklist

- [x] `hoveredHour` preservado para o hover verde.
- [x] `hoveredDayHour` adicionado para a seleção granular.
- [x] Chave única criada com dia + hora.
- [x] Célula normal usa `border-transparent`.
- [x] Célula sob o cursor usa `border-[#6F3CFF]`.
- [x] Hover verde permanece na linha inteira.
- [x] Hover sobre cartão aponta para a célula correspondente.
- [x] Hover não executa chamada HTTP.
- [x] Agrupamento cobre cartões simultâneos.
- [x] Agrupamento usa `pointer-events-none`.
- [x] Botão usa `rounded-full`.
- [x] Botão usa `text-[#6F3CFF]`.
- [x] Botão usa `focus-visible:ring-[#6F3CFF]`.
- [x] Triângulo e diagonal removidos.
- [x] Ação continua em lote.
- [x] Estados não elegíveis continuam preservados.
- [x] Testes, README, lint e build atualizados.
- [x] `git diff --check` executado.
- [x] `openspec validate --strict` executado.
- [ ] Inspeção visual em navegador local concluída.

## 14. Pendência e próximo passo

Código, testes, documentação e validação estrita estão concluídos. Permanecem
pendentes somente as tarefas de inspeção visual local, marcadas como 2.1 e 3.3
em `tasks.md`.

Não havia navegador disponível para verificar diretamente cartões simultâneos,
coluna intermediária, última coluna, rolagem horizontal, contraste sobre cartões
coloridos, foco do botão e ausência visual de diagonal, triângulo ou linha roxa
permanente.

O próximo passo é abrir a aplicação em navegador local, revisar esses cenários,
registrar o resultado em `tasks.md`, executar novamente a validação estrita e
só então arquivar a change.

## 15. Resumo final

```text
Estado normal:
  - sem borda roxa permanente
  - botão + circular no canto inferior direito

Mouse sobre uma célula dia + hora:
  - linha inteira com hover verde
  - somente a célula selecionada com 1px solid #6F3CFF
  - nenhuma chamada HTTP

Mouse sobre um cartão:
  - mesma célula dia + hora destacada
  - cartão continua abrindo detalhes

Clique no botão +:
  - abre Iniciar todos
  - não altera dados ao abrir

Confirmação:
  - uma chamada POST /api/appointments/start-current-hour
  - somente hora corrente e estados elegíveis são processados
  - a agenda é atualizada após o sucesso
```

A implementação preserva o comportamento de negócio e adiciona a clareza visual
solicitada para a célula selecionada e para o alcance da ação em lote.

