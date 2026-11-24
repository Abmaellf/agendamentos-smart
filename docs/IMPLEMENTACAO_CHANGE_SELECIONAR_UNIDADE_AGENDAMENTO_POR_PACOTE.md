# Implementação da Change `selecionar-unidade-agendamento-por-pacote`

Documento técnico consolidado da implementação realizada no front-end e na API
irmã para selecionar a unidade operacional antes de listar pacientes e pacotes
em um agendamento por pacote.

- Change: `selecionar-unidade-agendamento-por-pacote`
- Documento consolidado em: `2026-11-24`
- Front-end: `agendamento-smart-web/agendamentos-smart`
- Back-end: `api-agendamento-smart-api/agendamento-smart-api`
- Stack do front-end: React, TypeScript, RTK Query, Testing Library, MSW e Vitest
- Stack do back-end: Java 21, Spring Boot 3.4.5, Spring Security, JPA, Flyway, PostgreSQL e Testcontainers

## 1. Objetivo da alteração

O fluxo de agendamento por pacote precisava usar a mesma fronteira de unidade já
utilizada pelo agendamento manual. Antes da change, o diálogo permitia escolher
paciente e pacote sem estabelecer explicitamente a unidade que seria usada na
operação.

Isso criava quatro problemas principais:

1. O administrador não tinha um campo de unidade no agendamento por pacote.
2. O catálogo de pacientes era carregado de forma geral, sem `unitId`.
3. O catálogo de pacotes era consultado sem unidade e filtrado apenas no cliente
   em alguns cenários.
4. A API validava o pacote e o paciente pelo tenant/clínica, mas não garantia
   que unidade, paciente e pacote fossem compatíveis entre si.

A implementação passou a tratar uma única `unitId` efetiva como contexto do
fluxo inteiro:

```text
unidade efetiva
      |
      +--> catálogo de pacientes
      |
      +--> catálogo de pacotes ativos
      |
      +--> prévia do agendamento
      |
      +--> confirmação do agendamento
```

O front-end orienta a seleção e evita chamadas inconsistentes. A API continua
sendo a autoridade definitiva para autenticação, clínica, papel, unidade,
paciente, pacote, fingerprint e persistência.

## 2. Regras funcionais implementadas

| Usuário | Unidade no formulário | Pacientes | Pacotes | Operação no back-end |
| --- | --- | --- | --- | --- |
| `ADMIN` | Select editável com as unidades retornadas pelo catálogo autorizado | Somente pacientes da unidade selecionada | Somente pacotes ativos da unidade selecionada | Pode operar em unidades da própria clínica |
| `BASIC` no front-end / `USER` na API | Unidade derivada de `session.activeUnitId` e bloqueada | Somente pacientes da unidade da sessão | Somente pacotes ativos da unidade da sessão | Não pode informar ou consultar outra unidade |

Também foram implementadas as seguintes regras:

- sem unidade efetiva, o paciente não é consultado e fica desabilitado;
- sem unidade efetiva, o pacote não é consultado e fica desabilitado;
- ao trocar a unidade, o paciente, o pacote, os dias efetivos e a prévia são
  limpos;
- uma prévia antiga não pode continuar disponível depois de mudar unidade,
  paciente, pacote, data, horário, profissional ou dias;
- um pacote de outra unidade não pode ser usado para gerar prévia ou confirmar;
- um paciente sem vínculo com a unidade do pacote não pode ser usado;
- a unidade é enviada tanto no `preview` quanto no `confirm`;
- a unidade faz parte do fingerprint da prévia;
- a confirmação revalida todos os vínculos antes de salvar contrato e
  agendamentos;
- não foi criada migration, porque o contrato persistido já possuía `unit_id`.

## 3. O que existia antes e o que passou a existir depois

### 3.1 Front-end

Antes:

- `PackageAppointmentDialog` carregava pacientes por `/patient/list` sem unidade;
- `useGetUnitsQuery` era disparado, mas o resultado não era usado em um campo do
  formulário;
- o catálogo de pacotes era solicitado apenas com `{ active: true }`;
- a filtragem por unidade ocorria somente com `item.unitId === session.activeUnitId`
  para não administradores;
- o payload do preview e da confirmação não tinha `unitId`.

Depois:

- `ADMIN` seleciona a unidade em um `<select>`;
- `BASIC` recebe `activeUnitId` da sessão como valor fixo;
- pacientes são carregados por `/api/patients?unitId=<unidade>`;
- pacotes são carregados por `/api/service-packages?active=true&unitId=<unidade>`;
- o payload de preview e confirmação contém `unitId` obrigatório;
- a interface bloqueia ações enquanto os catálogos estão carregando, falharam,
  estão vazios ou não há prévia correspondente ao estado atual.

### 3.2 Back-end

Antes:

- `PackageAppointmentRequest` não tinha `unitId`;
- `PackageAppointmentService` buscava pacote ativo somente pela clínica;
- o paciente era validado somente pela clínica;
- o fingerprint usava pacote, paciente, data, horário, dias e quantidade, mas não
  unidade;
- `findById` de contratação validava apenas a clínica;
- `ServicePackageController` possuía `@PreAuthorize("hasRole('ADMIN')")` na
  classe inteira, impedindo `BASIC`/`USER` de ler o catálogo;
- `ServicePackageService.findAll` chamava `requireAdmin(user)` em todas as
  leituras.

Depois:

- `unitId` é obrigatório no DTO com `@NotNull`;
- a unidade é validada por `UnitScopeService`;
- pacote ativo precisa pertencer à unidade enviada;
- paciente precisa estar vinculado à mesma unidade;
- contratação por ID também é protegida pela unidade do contrato;
- fingerprint inclui `unitId`;
- leitura da coleção de pacotes é permitida para usuários autenticados, mas
  `USER` fica limitado à unidade da sessão e aos pacotes ativos;
- criação, detalhe administrativo, edição e alteração de status continuam
  restritos a `ADMIN`.

## 4. Contrato HTTP final

### 4.1 Catálogo de unidades

O diálogo reutiliza o endpoint já existente:

```http
GET /api/units
```

O resultado é transformado pelo adaptador em `UnitOption[]`:

```ts
export interface UnitOption {
  id: string
  name: string
  tenantId: string
  timeZone: string
}
```

O `ADMIN` pode selecionar qualquer unidade autorizada retornada pela API. Para
`BASIC`, o catálogo é usado para confirmar que `activeUnitId` ainda está
disponível; a unidade não pode ser substituída silenciosamente por outra.

### 4.2 Catálogo de pacientes

```http
GET /api/patients?unitId=<unit-id>
```

O front-end não chama esse endpoint enquanto `unitId` estiver vazia. A query
usa uma chave de cache que também contém a unidade:

```ts
getAppointmentPatients: builder.query<PatientOption[], string>({
  query: (unitId) => ({
    url: '/api/patients',
    params: { unitId },
  }),
  transformResponse: (response: unknown) =>
    contentOf(response as CollectionResponse<PatientOption>),
  providesTags: (_result, _error, unitId) => [
    { type: 'PatientCatalog', id: 'LIST' },
    { type: 'PatientCatalog', id: `UNIT-${unitId}` },
  ],
})
```

Esse adaptador já era usado pelo agendamento manual e foi reutilizado no
agendamento por pacote para manter a mesma semântica.

### 4.3 Catálogo de pacotes

```http
GET /api/service-packages?active=true&unitId=<unit-id>
```

O DTO de filtro do front-end já aceitava `unitId`:

```ts
export interface ServicePackageFilters {
  unitId?: string
  serviceId?: string
  active?: boolean
  totalSessions?: number
  name?: string
}
```

O fluxo de contratação passa a preencher `unitId` com a unidade efetiva. O
back-end ainda filtra e autoriza novamente, portanto o parâmetro não é tratado
como prova de permissão.

### 4.4 Preview

```http
POST /api/package-appointments/preview
Content-Type: application/json
```

Payload anterior:

```json
{
  "packageId": "package-1",
  "patientId": "patient-1",
  "startDate": "2026-08-20",
  "time": "08:30",
  "professionalId": null,
  "effectiveWeekDays": ["MONDAY", "WEDNESDAY"]
}
```

Payload atual:

```json
{
  "packageId": "package-1",
  "patientId": "patient-1",
  "unitId": "unit-a",
  "startDate": "2026-08-20",
  "time": "08:30",
  "professionalId": null,
  "effectiveWeekDays": ["MONDAY", "WEDNESDAY"]
}
```

Resposta de prévia:

```json
{
  "packageId": "package-1",
  "patientId": "patient-1",
  "unitId": "unit-a",
  "totalPrice": "500.00",
  "firstDate": "2026-08-24",
  "lastDate": "2026-09-02",
  "sessions": [
    {
      "sequence": 1,
      "date": "2026-08-24",
      "time": "08:30",
      "startsAt": "2026-08-24T12:30:00.000Z"
    }
  ],
  "fingerprint": "<sha-256>"
}
```

### 4.5 Confirm

```http
POST /api/package-appointments/confirm
Content-Type: application/json
Idempotency-Key: <uuid-gerado-pelo-front>
X-Preview-Fingerprint: <fingerprint-da-previa>
```

O corpo de confirmação usa o mesmo `PackageAppointmentInput` do preview e,
portanto, também contém `unitId`.

```json
{
  "packageId": "package-1",
  "patientId": "patient-1",
  "unitId": "unit-a",
  "startDate": "2026-08-20",
  "time": "08:30",
  "professionalId": null,
  "effectiveWeekDays": ["MONDAY", "WEDNESDAY"]
}
```

No front-end, a mutation continua gerando um novo `Idempotency-Key` com
`crypto.randomUUID()` e encaminha o fingerprint somente quando ele existe.

### 4.6 Erros relevantes

| Situação | Resultado esperado |
| --- | --- |
| `unitId` ausente no body | `400` por validação do DTO |
| `BASIC`/`USER` informa outra unidade | `404 TENANT_RESOURCE_NOT_FOUND` |
| pacote inexistente, inativo ou de outra unidade | `404 TENANT_RESOURCE_NOT_FOUND` |
| paciente da clínica, mas sem vínculo com a unidade | `404 TENANT_RESOURCE_NOT_FOUND` |
| consulta de catálogo BASIC em unidade externa | `404 TENANT_RESOURCE_NOT_FOUND` |
| fingerprint incompatível | `409 STALE_PACKAGE_PREVIEW` |
| confirmação sem `Idempotency-Key` | `400 IDEMPOTENCY_KEY_REQUIRED` |
| unidade BASIC não disponível no catálogo do front-end | fluxo bloqueado e mensagem para o usuário |
| unidade sem pacientes | mensagem de catálogo vazio e preview desabilitado |

## 5. Implementação no front-end

### 5.1 Arquivo `package-appointments.ts`

Arquivo:

```text
src/features/packages/api/package-appointments.ts
```

#### Como era

O input não carregava unidade:

```ts
export interface PackageAppointmentInput {
  packageId: string
  patientId: string
  startDate: string
  time: string
  professionalId?: string | null
  effectiveWeekDays: PackageWeekDay[]
}
```

O preview já possuía `unitId` na resposta, mas esse valor era apenas retornado
pelo servidor. Ele não era enviado como contexto da requisição.

As mutations eram definidas de forma compacta:

```ts
previewPackageAppointment: builder.mutation<
  PackageAppointmentPreview,
  PackageAppointmentInput
>({
  query: (data) => ({
    url: '/api/package-appointments/preview',
    method: 'POST',
    data,
  }),
})
```

#### Como ficou

```ts
import { baseApi } from '@/lib/base-api'

import type { PackageWeekDay } from './packages'

export interface PackageAppointmentInput {
  packageId: string
  patientId: string
  unitId: string
  startDate: string
  time: string
  professionalId?: string | null
  effectiveWeekDays: PackageWeekDay[]
}

export interface PackageAppointmentSession {
  sequence: number
  date: string
  time: string
  startsAt: string
}

export interface PackageAppointmentPreview {
  packageId: string
  patientId: string
  unitId: string
  totalPrice: string
  firstDate: string
  lastDate: string
  sessions: PackageAppointmentSession[]
  fingerprint: string
}

export interface PackageAppointmentConfirmation {
  contractId: string
  appointmentIds: string[]
  preview: PackageAppointmentPreview | null
}

export const packageAppointmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    previewPackageAppointment: builder.mutation<
      PackageAppointmentPreview,
      PackageAppointmentInput
    >({
      query: (data) => ({
        url: '/api/package-appointments/preview',
        method: 'POST',
        data,
      }),
    }),
    confirmPackageAppointment: builder.mutation<
      PackageAppointmentConfirmation,
      { data: PackageAppointmentInput; fingerprint?: string }
    >({
      query: ({ data, fingerprint }) => ({
        url: '/api/package-appointments/confirm',
        method: 'POST',
        data,
        headers: {
          'Idempotency-Key': crypto.randomUUID(),
          ...(fingerprint ? { 'X-Preview-Fingerprint': fingerprint } : {}),
        },
      }),
      invalidatesTags: [{ type: 'Appointment', id: 'LIST' }],
    }),
  }),
})

export const {
  usePreviewPackageAppointmentMutation,
  useConfirmPackageAppointmentMutation,
} = packageAppointmentsApi
```

#### Explicação

- `unitId: string` torna o contexto obrigatório no TypeScript;
- o mesmo tipo é usado pelo preview e pelo confirm, evitando que uma operação
  aceite unidade e a outra não;
- `PackageAppointmentPreview.unitId` continua representando a unidade calculada
  pelo servidor;
- o `fingerprint` continua sendo enviado por `X-Preview-Fingerprint`;
- a invalidação da lista de agendamentos permanece inalterada após confirmação;
- a existência de `unitId` no TypeScript melhora o contrato, mas não substitui a
  validação da API.

### 5.2 Arquivo `package-appointment-dialog.tsx`

Arquivo:

```text
src/features/packages/components/package-appointment-dialog.tsx
```

#### Como era

O componente tinha estado somente para paciente, pacote, data, horário,
profissional e dias:

```tsx
const [patientId, setPatientId] = useState('')
const [packageId, setPackageId] = useState('')
const [startDate, setStartDate] = useState(defaultDate ?? '')
const [time, setTime] = useState('')
const [professionalId, setProfessionalId] = useState('')
const [effectiveWeekDays, setEffectiveWeekDays] = useState<PackageWeekDay[]>([])
```

Os catálogos eram carregados assim:

```tsx
const patients = useGetPatientsQuery(undefined, { skip: !open })
useGetUnitsQuery(undefined, { skip: !open })
const packages = useGetServicePackagesQuery(
  { active: true },
  { skip: !open },
)
```

O filtro de pacotes era apenas uma proteção de renderização para BASIC:

```tsx
const availablePackages = useMemo(
  () =>
    packages.data?.filter(
      (item) =>
        session.user.role === 'ADMIN' || item.unitId === session.activeUnitId,
    ) ?? [],
  [packages.data, session.activeUnitId, session.user.role],
)
```

O preview não enviava unidade:

```tsx
await preview({
  packageId,
  patientId,
  startDate,
  time,
  professionalId: professionalId || null,
  effectiveWeekDays,
}).unwrap()
```

#### Como ficou: estado e unidade efetiva

```tsx
const [unitId, setUnitId] = useState('')
const [patientId, setPatientId] = useState('')
const [packageId, setPackageId] = useState('')
const [startDate, setStartDate] = useState(defaultDate ?? '')
const [time, setTime] = useState('')
const [professionalId, setProfessionalId] = useState('')
const [effectiveWeekDays, setEffectiveWeekDays] = useState<PackageWeekDay[]>(
  [],
)

const unitIsReadOnly = session.user.role === 'BASIC'
const unitsQuery = useGetUnitsQuery(undefined, { skip: !open })
const effectiveUnitId = unitId
```

O estado `unitId` é mantido dentro do diálogo. A regra de papel fica explícita
em `unitIsReadOnly`. O valor `effectiveUnitId` representa a unidade usada por
todas as consultas e mutations do componente.

#### Como ficou: queries dependentes

```tsx
const patientsQuery = useGetAppointmentPatientsQuery(effectiveUnitId, {
  skip: !open || !effectiveUnitId,
})

const packagesQuery = useGetServicePackagesQuery(
  { active: true, unitId: effectiveUnitId || undefined },
  { skip: !open || !effectiveUnitId },
)

const selectedPackage = packagesQuery.data?.find(
  (item) => item.id === packageId,
)

const professionalsQuery = useGetProfessionalsQuery(
  selectedPackage?.serviceId ?? '',
  { skip: !open || !selectedPackage },
)

const unitOptions = unitsQuery.data ?? []
const availablePatients = patientsQuery.data ?? []
const availablePackages = useMemo(
  () =>
    packagesQuery.data?.filter(
      (item) => item.active && item.unitId === effectiveUnitId,
    ) ?? [],
  [effectiveUnitId, packagesQuery.data],
)
```

Detalhes importantes:

- pacientes só são consultados quando `open === true` e existe unidade;
- pacotes só são consultados com a mesma condição;
- o request de pacotes inclui `active: true` e `unitId`;
- o filtro local mantém apenas itens ativos e com `item.unitId` igual à unidade
  efetiva, funcionando como uma segunda proteção de apresentação;
- profissionais continuam dependendo do serviço do pacote escolhido;
- a consulta de profissionais não foi alterada para receber unidade porque o
  contrato existente já é por serviço e a autorização final continua no
  back-end.

#### Como ficou: estado de unidade BASIC e prévia atual

```tsx
const basicUnitUnavailable =
  unitIsReadOnly &&
  unitsQuery.isSuccess &&
  !unitOptions.some((unit) => unit.id === session.activeUnitId)

const hasUnit = Boolean(effectiveUnitId) && !basicUnitUnavailable

const previewIsCurrent =
  Boolean(previewState.data) &&
  previewState.data?.unitId === effectiveUnitId &&
  previewState.data?.patientId === patientId &&
  previewState.data?.packageId === packageId
```

`basicUnitUnavailable` diferencia uma sessão sem unidade disponível de uma
unidade ainda não escolhida por um ADMIN. Nesse caso, a interface mostra alerta,
não habilita a operação e não troca automaticamente para outra unidade.

`previewIsCurrent` impede que o botão de confirmação seja exibido para uma
prévia de outra unidade, paciente ou pacote. A API ainda revalida o fingerprint
e todos os vínculos.

#### Como ficou: preenchimento automático para BASIC

```tsx
useEffect(() => {
  if (!open || !unitIsReadOnly || !unitsQuery.isSuccess) return

  const hasActiveUnit = unitOptions.some(
    (unit) => unit.id === session.activeUnitId,
  )
  setUnitId(hasActiveUnit ? session.activeUnitId : '')
}, [
  open,
  session.activeUnitId,
  unitIsReadOnly,
  unitOptions,
  unitsQuery.isSuccess,
])
```

O efeito só inicializa a unidade depois de o catálogo ter carregado. Assim, não
é usado um valor de sessão que não exista no catálogo autorizado.

#### Como era e como ficou: limpeza de estado dependente

Antes, a escolha do pacote somente alterava o pacote e seus dias:

```tsx
function choosePackage(id: string) {
  const item = availablePackages.find((value) => value.id === id)
  setPackageId(id)
  setEffectiveWeekDays(item?.weekDays ?? [])
}
```

Depois, todas as alterações relevantes invalidam a prévia:

```tsx
function resetPreview() {
  previewState.reset()
}

function changeUnit(nextUnitId: string) {
  setUnitId(nextUnitId)
  setPatientId('')
  setPackageId('')
  setEffectiveWeekDays([])
  resetPreview()
}

function changePatient(nextPatientId: string) {
  setPatientId(nextPatientId)
  resetPreview()
}

function choosePackage(nextPackageId: string) {
  const item = availablePackages.find((value) => value.id === nextPackageId)
  setPackageId(nextPackageId)
  setEffectiveWeekDays(item?.weekDays ?? [])
  resetPreview()
}
```

Data, horário, profissional e dias também chamam `resetPreview()` em seus
handlers. A regra evita confirmar uma combinação diferente daquela usada para
gerar a prévia.

#### Como era e como ficou: preview

Antes:

```tsx
async function simulate() {
  if (!packageId || !patientId || !startDate || !time || effectiveWeekDays.length === 0) return

  await preview({
    packageId,
    patientId,
    startDate,
    time,
    professionalId: professionalId || null,
    effectiveWeekDays,
  }).unwrap()
}
```

Depois:

```tsx
async function simulate() {
  if (
    !hasUnit ||
    !packageId ||
    !patientId ||
    !startDate ||
    !time ||
    effectiveWeekDays.length === 0
  ) {
    return
  }

  try {
    await preview({
      packageId,
      patientId,
      unitId: effectiveUnitId,
      startDate,
      time,
      professionalId: professionalId || null,
      effectiveWeekDays,
    }).unwrap()
  } catch {
    toast.error('Não foi possível gerar a prévia.')
  }
}
```

Além de enviar `unitId`, a função agora exige `hasUnit` antes de chamar a API.
O tratamento de erro mantém o feedback existente sem expor detalhes internos.

#### Como era e como ficou: confirmação

Antes, qualquer `previewState.data` era suficiente para confirmar:

```tsx
async function submit() {
  if (!previewState.data) return

  await confirm({
    data: {
      packageId,
      patientId,
      startDate,
      time,
      professionalId: professionalId || null,
      effectiveWeekDays,
    },
    fingerprint: previewState.data.fingerprint,
  }).unwrap()
}
```

Depois:

```tsx
async function submit() {
  if (!previewIsCurrent || !previewState.data) return

  try {
    await confirm({
      data: {
        packageId,
        patientId,
        unitId: effectiveUnitId,
        startDate,
        time,
        professionalId: professionalId || null,
        effectiveWeekDays,
      },
      fingerprint: previewState.data.fingerprint,
    }).unwrap()
    toast.success('Agendamentos do pacote criados.')
    setOpen(false)
  } catch {
    toast.error('Não foi possível confirmar o pacote.')
  }
}
```

O `previewIsCurrent` protege o fluxo no cliente e o `fingerprint` protege o
fluxo no servidor. A confirmação continua invalidando a lista de agendamentos
por meio da mutation RTK Query.

#### Como ficou: campo de unidade e estados da interface

```tsx
<label>
  Unidade
  <select
    aria-label="Unidade"
    className={controlClassName}
    value={effectiveUnitId}
    onChange={(event) => changeUnit(event.target.value)}
    disabled={unitIsReadOnly || unitsQuery.isLoading}
  >
    <option value="">Selecione a unidade</option>
    {unitOptions.map((unit) => (
      <option key={unit.id} value={unit.id}>
        {unit.name}
      </option>
    ))}
  </select>
</label>

{basicUnitUnavailable ? (
  <p role="alert">
    A unidade da sua sessão não está disponível para este fluxo.
  </p>
) : null}
```

O paciente agora depende da unidade:

```tsx
<select
  aria-label="Paciente"
  className={controlClassName}
  value={patientId}
  onChange={(event) => changePatient(event.target.value)}
  disabled={!hasUnit || patientsQuery.isLoading}
>
  <option value="">
    {hasUnit ? 'Selecione o paciente' : 'Selecione a unidade primeiro'}
  </option>
  {availablePatients.map((item) => (
    <option key={item.id} value={item.id}>
      {item.name}
    </option>
  ))}
</select>
```

O pacote segue a mesma regra:

```tsx
<select
  aria-label="Pacote"
  className={controlClassName}
  value={packageId}
  onChange={(event) => choosePackage(event.target.value)}
  disabled={!hasUnit || packagesQuery.isLoading}
>
  <option value="">
    {hasUnit ? 'Selecione o pacote' : 'Selecione a unidade primeiro'}
  </option>
  {availablePackages.map((item) => (
    <option key={item.id} value={item.id}>
      {item.name} — {item.totalSessions} sessões
    </option>
  ))}
</select>
```

Estados de feedback adicionados:

```tsx
{hasUnit && patientsQuery.isSuccess && availablePatients.length === 0 ? (
  <p>Nenhum paciente disponível para esta unidade.</p>
) : null}

{hasUnit && packagesQuery.isSuccess && availablePackages.length === 0 ? (
  <p>Nenhum pacote disponível para esta unidade.</p>
) : null}

{isLoading ? <p role="status">Carregando opções...</p> : null}
{catalogsError ? (
  <p role="alert">Não foi possível carregar as opções.</p>
) : null}
```

O botão de preview só é habilitado quando todos os requisitos estão presentes:

```tsx
<Button
  type="button"
  onClick={() => void simulate()}
  disabled={
    !hasUnit ||
    !patientId ||
    !packageId ||
    !startDate ||
    !time ||
    effectiveWeekDays.length === 0 ||
    isLoading ||
    catalogsError ||
    previewState.isLoading
  }
>
  Gerar prévia
</Button>
```

A prévia somente aparece quando ainda corresponde ao contexto atual:

```tsx
{previewState.data && previewIsCurrent ? (
  <section aria-label="Prévia do pacote" className="rounded border p-3">
    <p>
      {previewState.data.sessions.length} sessões ·{' '}
      {previewState.data.firstDate} até {previewState.data.lastDate}
    </p>
    <ul>
      {previewState.data.sessions.map((item) => (
        <li key={item.sequence}>
          {item.sequence}. {item.date} às {item.time}
        </li>
      ))}
    </ul>
    <Button
      type="button"
      onClick={() => void submit()}
      disabled={confirmState.isLoading}
    >
      Confirmar agendamentos
    </Button>
  </section>
) : null}
```

### 5.3 Mock Server do front-end

Arquivo:

```text
src/test/server.ts
```

Como era: não havia handler padrão para `GET /api/service-packages` no MSW.

Como ficou:

```ts
http.get('http://localhost:8080/api/service-packages', () =>
  HttpResponse.json({ content: [] }),
),
```

Esse handler padrão evita que as suítes não relacionadas ao agendamento por
pacote recebam uma requisição sem resposta. Os testes específicos usam
`server.use(...)` para substituir o handler e registrar filtros, payloads de
preview e payloads de confirmação.

### 5.4 Teste de integração do diálogo

Arquivo novo:

```text
src/features/packages/__tests__/package-appointment-dialog.integration.test.tsx
```

O teste cria dois pacotes, um para `unit-a` e outro para `unit-b`, e intercepta
os endpoints de catálogo e contratação. Os cenários cobertos são:

1. `ADMIN` precisa escolher uma unidade antes da consulta de pacientes.
2. `BASIC` recebe `unit-a` da sessão e não pode trocar a unidade.
3. `ADMIN` troca de `unit-a` para `unit-b` e o componente limpa paciente,
   pacote e prévia.
4. preview e confirm enviam `unitId` junto com paciente e pacote.
5. uma unidade sem pacientes mostra o estado vazio e mantém o preview
   desabilitado.

Trecho do handler de pacotes usado nos testes:

```tsx
http.get('http://localhost:8080/api/service-packages', ({ request }) => {
  const params = new URL(request.url).searchParams
  packageQueries.push(params)
  const unitId = params.get('unitId')
  const packages = [packageForUnitA, packageForUnitB].filter(
    (item) => !unitId || item.unitId === unitId,
  )
  return HttpResponse.json({ content: packages })
})
```

Trecho do teste de seleção dependente:

```tsx
await openDialog(user)

expect(screen.getByRole('combobox', { name: 'Paciente' })).toBeDisabled()
expect(apiScenario.appointmentPatientQueries).toHaveLength(0)

await selectOption(user, 'Unidade', 'unit-a')

await waitFor(() =>
  expect(
    apiScenario.appointmentPatientQueries[
      apiScenario.appointmentPatientQueries.length - 1
    ]?.get('unitId'),
  ).toBe('unit-a'),
)
```

Trecho do teste de payload:

```tsx
expect(previewRequests[0]).toMatchObject({
  unitId: 'unit-a',
  patientId: 'patient-a',
  packageId: 'package-unit-a',
})

await user.click(
  screen.getByRole('button', { name: /confirmar agendamentos/i }),
)

await waitFor(() => expect(confirmationRequests).toHaveLength(1))
expect(confirmationRequests[0]).toMatchObject({
  unitId: 'unit-a',
  patientId: 'patient-a',
  packageId: 'package-unit-a',
})
```

### 5.5 README da feature no front-end

Arquivo:

```text
src/features/packages/README.md
```

O texto anterior descrevia o diálogo somente com paciente, pacote, data e
horário. O texto atual documenta:

- a unidade como primeiro contexto do fluxo;
- `ADMIN` escolhendo uma unidade autorizada;
- `BASIC` usando `activeUnitId` fixo;
- filtros de paciente e pacote por unidade;
- `unitId` no preview e confirm;
- a API como autoridade de autorização;
- a dependência da API irmã para validações de segurança.

## 6. Implementação no back-end

Os caminhos desta seção são relativos à raiz:

```text
/home/abmael/workspace/01-MEUS-PROJETOS-OFICIAIS-PRD-TEST/5-agendamentos-smart/api-agendamento-smart-api/agendamento-smart-api
```

### 6.1 DTO `PackageAppointmentRequest`

Arquivo:

```text
src/main/java/com/agendamento/smart/dtos/packageappointment/PackageAppointmentRequest.java
```

#### Como era

```java
public record PackageAppointmentRequest(
        @NotNull UUID packageId,
        @NotNull UUID patientId,
        @NotNull LocalDate startDate,
        @NotNull LocalTime time,
        UUID professionalId,
        @NotEmpty Set<PackageWeekDay> effectiveWeekDays) {}
```

#### Como ficou

```java
public record PackageAppointmentRequest(
        @NotNull UUID packageId,
        @NotNull UUID patientId,
        @NotNull UUID unitId,
        @NotNull LocalDate startDate,
        @NotNull LocalTime time,
        UUID professionalId,
        @NotEmpty Set<PackageWeekDay> effectiveWeekDays) {}
```

`unitId` é obrigatório no nível de validação HTTP. Portanto, requests legados
que omitam a unidade não devem ser inferidos automaticamente, inclusive para
ADMIN. A unidade é um dado de contexto do comando, não uma autorização enviada
pelo cliente.

### 6.2 Separação de leitura e mutação no controller

Arquivo:

```text
src/main/java/com/agendamento/smart/controller/servicepackage/ServicePackageController.java
```

#### Como era

Toda a classe possuía a autorização administrativa:

```java
@RestController
@RequestMapping("/api/service-packages")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ServicePackageController {
```

Esse desenho fazia o `GET /api/service-packages` retornar `403` para usuários
`USER`, mesmo quando eles só precisavam ler pacotes da própria unidade.

#### Como ficou

O `GET` da coleção ficou sem anotação administrativa:

```java
@GetMapping
public CatalogResponse<ServicePackageResponse> findAll(@AuthenticationPrincipal User user,
        @RequestParam(required = false) UUID unitId,
        @RequestParam(required = false) UUID serviceId,
        @RequestParam(required = false) Boolean active,
        @RequestParam(required = false) Integer totalSessions,
        @RequestParam(required = false) String name) {
    return new CatalogResponse<>(service.findAll(user, unitId, serviceId, active, totalSessions, name));
}
```

As operações administrativas receberam autorização individual:

```java
@PostMapping
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<ServicePackageResponse> create(...) { ... }

@GetMapping("/{id}")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<ServicePackageResponse> findById(...) { ... }

@PatchMapping("/{id}")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<ServicePackageResponse> update(...) { ... }

@PatchMapping("/{id}/status")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<ServicePackageResponse> updateStatus(...) { ... }
```

A remoção da anotação da classe não tornou as mutations públicas: ela apenas
separou o endpoint de leitura operacional das operações de gestão.

### 6.3 Autorização do catálogo em `ServicePackageService`

Arquivo:

```text
src/main/java/com/agendamento/smart/service/ServicePackageService.java
```

#### Como era

```java
@Transactional(readOnly = true)
public List<ServicePackageResponse> findAll(User user, UUID unitId,
        UUID serviceId, Boolean active, Integer totalSessions, String name) {
    requireAdmin(user);
    Stream<ServicePackageDefinition> packages = packageRepository
            .findAllByClinicIdOrderByNameAsc(user.getClinic().getId()).stream();
    if (unitId != null) {
        packages = packages.filter(item -> item.getUnit().getId().equals(unitId));
    }
    if (serviceId != null) {
        packages = packages.filter(item -> item.getService().getId().equals(serviceId));
    }
    if (active != null) {
        packages = packages.filter(item -> item.isActive() == active);
    }
    // demais filtros
    return packages.map(this::toResponse).toList();
}
```

#### Como ficou

```java
private final UnitScopeService unitScopeService;

@Transactional(readOnly = true)
public List<ServicePackageResponse> findAll(User user, UUID unitId,
        UUID serviceId, Boolean active, Integer totalSessions, String name) {
    if (user.getRole() != UserRole.ADMIN) {
        UUID allowedUnitId = unitScopeService.requireSingleAllowedUnitId(user);
        if (unitId != null && !unitId.equals(allowedUnitId)) {
            throw DomainException.tenantResourceNotFound();
        }
        unitId = allowedUnitId;
        active = true;
    } else if (unitId != null) {
        unitRepository.findByIdAndClinicId(unitId, user.getClinic().getId())
                .orElseThrow(this::packageNotFound);
    }

    UUID requestedUnitId = unitId;
    Boolean requestedActive = active;
    Stream<ServicePackageDefinition> packages = packageRepository
            .findAllByClinicIdOrderByNameAsc(user.getClinic().getId()).stream();
    if (requestedUnitId != null) {
        packages = packages.filter(item ->
                item.getUnit().getId().equals(requestedUnitId));
    }
    if (serviceId != null) {
        packages = packages.filter(item -> item.getService().getId().equals(serviceId));
    }
    if (requestedActive != null) {
        packages = packages.filter(item -> item.isActive() == requestedActive);
    }
    if (totalSessions != null) {
        packages = packages.filter(item -> item.getTotalSessions().equals(totalSessions));
    }
    if (name != null && !name.isBlank()) {
        String normalized = name.trim().toLowerCase();
        packages = packages.filter(item ->
                item.getName().toLowerCase().contains(normalized));
    }
    return packages.map(this::toResponse).toList();
}
```

Explicação da decisão:

1. Para qualquer papel diferente de ADMIN, o serviço chama
   `requireSingleAllowedUnitId(user)`, derivando a unidade da sessão.
2. Se o cliente enviar outra unidade, a API retorna o erro genérico de recurso
   não encontrado e não expõe a existência de dados externos.
3. Mesmo que o cliente envie `active=false`, o serviço força `active=true` para
   usuários operacionais.
4. Para ADMIN, uma `unitId` informada é validada com
   `findByIdAndClinicId`, garantindo que a unidade pertença à clínica do
   principal.
5. `requestedUnitId` e `requestedActive` são variáveis efetivamente finais para
   poderem ser usadas nas lambdas de `Stream` depois da normalização dos
   parâmetros.
6. `create`, `findById`, `update` e `updateStatus` continuam chamando
   `requireAdmin(user)` dentro do service, além da proteção no controller.

### 6.4 Validação de unidade no `PackageAppointmentService`

Arquivo:

```text
src/main/java/com/agendamento/smart/service/packageappointment/PackageAppointmentService.java
```

#### Como era

```java
private final PatientRepository patientRepository;

@Transactional(readOnly = true)
public PackageAppointmentPreviewResponse preview(
        PackageAppointmentRequest request, User user) {
    ServicePackageDefinition definition = findPackage(request.packageId(), user);
    validatePatient(request.patientId(), definition);
    List<PackageAppointmentSession> sessions = sessions(definition, request);
    return response(definition, request, sessions);
}

private ServicePackageDefinition findPackage(UUID id, User user) {
    return packageRepository.findByIdAndClinicId(id, user.getClinic().getId())
            .filter(ServicePackageDefinition::isActive)
            .orElseThrow(DomainException::tenantResourceNotFound);
}

private void validatePatient(UUID patientId,
        ServicePackageDefinition definition) {
    patientRepository.findByIdAndClinicIdWithUnits(
            patientId, definition.getClinic().getId())
            .orElseThrow(DomainException::tenantResourceNotFound);
}
```

O código antigo verificava apenas clínica e situação do pacote. Um paciente
qualquer da clínica podia passar pela validação mesmo não estando associado à
unidade do pacote.

#### Como ficou: dependência de escopo

```java
private final PatientRepository patientRepository;
private final UnitScopeService unitScopeService;
```

#### Como ficou: preview

```java
@Transactional(readOnly = true)
public PackageAppointmentPreviewResponse preview(
        PackageAppointmentRequest request, User user) {
    requireUnitScope(user, request.unitId());
    ServicePackageDefinition definition = findPackage(
            request.packageId(), request.unitId(), user);
    validatePatient(request.patientId(), definition, request.unitId());
    List<PackageAppointmentSession> sessions = sessions(definition, request);
    return response(definition, request, sessions);
}
```

A ordem é deliberada: primeiro a unidade enviada é comparada ao escopo do
usuário; depois o pacote é resolvido no tenant e na unidade; por fim, o paciente
é validado na mesma unidade.

#### Como ficou: pacote e paciente compatíveis

```java
private ServicePackageDefinition findPackage(
        UUID id, UUID unitId, User user) {
    return packageRepository.findByIdAndClinicId(
                    id, user.getClinic().getId())
            .filter(ServicePackageDefinition::isActive)
            .filter(definition -> definition.getUnit().getId().equals(unitId))
            .orElseThrow(DomainException::tenantResourceNotFound);
}

private void validatePatient(UUID patientId,
        ServicePackageDefinition definition, UUID unitId) {
    patientRepository.findByIdAndClinicIdWithUnits(
                    patientId, definition.getClinic().getId())
            .filter(patient -> patient.getUnits().stream()
                    .anyMatch(unit -> unit.getId().equals(unitId)))
            .orElseThrow(DomainException::tenantResourceNotFound);
}

private void requireUnitScope(User user, UUID unitId) {
    if (unitId == null || unitScopeService.allowedUnits(user).stream()
            .noneMatch(unit -> unit.getId().equals(unitId))) {
        throw DomainException.tenantResourceNotFound();
    }
}
```

Consequências:

- ADMIN pode usar uma unidade retornada por `allowedUnits(user)` da própria
  clínica;
- USER/BASIC só passa quando `unitId` coincide com sua `clinicUnit`;
- pacote inativo também é rejeitado;
- pacote da clínica correta, mas de unidade diferente, é rejeitado;
- paciente da clínica correta, mas sem o vínculo com a unidade efetiva, é
  rejeitado;
- todas as falhas usam `TENANT_RESOURCE_NOT_FOUND`, evitando revelar detalhes
  do recurso que está fora do escopo.

### 6.5 Confirmação, fingerprint e consulta por ID

#### Como era: confirmação sem unidade no segundo lookup

```java
PackageAppointmentPreviewResponse preview = preview(request, user);
if (fingerprint != null && !fingerprint.equals(preview.fingerprint())) {
    throw new DomainException(
            "STALE_PACKAGE_PREVIEW",
            "A prévia do pacote está desatualizada.",
            HttpStatus.CONFLICT);
}
ServicePackageDefinition definition = findPackage(request.packageId(), user);
```

#### Como ficou: confirmação com revalidação

```java
PackageAppointmentPreviewResponse preview = preview(request, user);
if (fingerprint != null && !fingerprint.equals(preview.fingerprint())) {
    throw new DomainException(
            "STALE_PACKAGE_PREVIEW",
            "A prévia do pacote está desatualizada.",
            HttpStatus.CONFLICT);
}
ServicePackageDefinition definition = findPackage(
        request.packageId(), request.unitId(), user);
```

O método `preview(request, user)` é chamado dentro da confirmação. Portanto,
antes de qualquer `saveAndFlush`, a API repete as validações de unidade, pacote,
paciente e geração da prévia.

O contrato continua sendo persistido com a unidade derivada da definição:

```java
contract.setClinic(user.getClinic());
contract.setPackageDefinition(definition);
contract.setPatient(
        patientRepository.findByIdAndClinicIdWithUnits(
                request.patientId(), user.getClinic().getId())
                .orElseThrow(DomainException::tenantResourceNotFound));
contract.setUnit(definition.getUnit());
contract.setService(definition.getService());
contract.setCreatedBy(user);
contract.setTotalSessions(definition.getTotalSessions());
contract.setTotalPrice(definition.getTotalPrice());
contract.setRequestedStartDate(request.startDate());
contract.setAppointmentTime(request.time());
contract.setEffectiveFirstDate(preview.firstDate());
contract.setEffectiveLastDate(preview.lastDate());
contract.setEffectiveWeekDays(
        new LinkedHashSet<>(request.effectiveWeekDays()));
contract.setIdempotencyKey(key);
```

Como o pacote foi validado contra `request.unitId()`,
`definition.getUnit()` é a unidade efetiva já autorizada. Os agendamentos
gerados no loop também usam `definition.getUnit().getId()`.

#### Como era e como ficou: consulta de contratação

Antes, a consulta verificava apenas o tenant:

```java
@Transactional(readOnly = true)
public PackageAppointmentConfirmationResponse findById(
        UUID id, User user) {
    var c = contractRepository.findByIdAndClinicId(
            id, user.getClinic().getId())
            .orElseThrow(DomainException::tenantResourceNotFound);
    return new PackageAppointmentConfirmationResponse(
            c.getId(), List.of(), null);
}
```

Depois, a unidade do contrato também precisa estar no escopo:

```java
@Transactional(readOnly = true)
public PackageAppointmentConfirmationResponse findById(
        UUID id, User user) {
    var c = contractRepository.findByIdAndClinicId(
            id, user.getClinic().getId())
            .orElseThrow(DomainException::tenantResourceNotFound);
    requireUnitScope(user, c.getUnit().getId());
    return new PackageAppointmentConfirmationResponse(
            c.getId(), List.of(), null);
}
```

#### Como era e como ficou: fingerprint

Antes, a entrada do SHA-256 era:

```java
d.getId() + "|" + r.patientId() + "|" + r.startDate()
        + "|" + r.time() + "|" + r.effectiveWeekDays()
        + "|" + s.size()
```

Depois, `r.unitId()` foi incluído entre paciente e data:

```java
private String fingerprint(
        ServicePackageDefinition d,
        PackageAppointmentRequest r,
        List<PackageAppointmentSession> s) {
    try {
        var md = MessageDigest.getInstance("SHA-256");
        return HexFormat.of().formatHex(md.digest(
                (d.getId() + "|" + r.patientId() + "|" + r.unitId()
                        + "|" + r.startDate() + "|" + r.time()
                        + "|" + r.effectiveWeekDays() + "|" + s.size())
                        .getBytes(StandardCharsets.UTF_8)));
    } catch (Exception e) {
        throw new IllegalStateException(e);
    }
}
```

Assim, uma prévia calculada para uma unidade não é equivalente a uma prévia
calculada para outra unidade, mesmo que os demais campos sejam iguais.

### 6.6 Testes de service no back-end

Arquivo:

```text
src/test/java/com/agendamento/smart/service/packageappointment/PackageAppointmentServiceTest.java
```

Foram adicionados testes unitários com Mockito para:

- `previewPreservesTheAuthorizedUnitInItsResponseAndFingerprint`:
  verifica a unidade na resposta e que a troca de unidade altera o fingerprint;
- `previewRejectsPatientFromAnotherUnit`:
  configura um paciente vinculado a outra unidade e espera
  `TENANT_RESOURCE_NOT_FOUND`;
- `basicCannotPreviewAnotherUnit`:
  configura `UserRole.USER`, informa uma unidade diferente e verifica que o
  repositório de pacotes nem é consultado;
- `confirmRejectsAnIncompatiblePatientBeforePersistence`:
  verifica que a confirmação falha antes de `saveAndFlush` do contrato e antes
  de criar qualquer agendamento.

Trecho do teste de ausência de persistência parcial:

```java
assertThatThrownBy(() -> service.confirm(
        fixture.request(), fixture.user(), "key", null))
        .isInstanceOf(DomainException.class);

verify(contractRepository, never())
        .saveAndFlush(any(PackageAppointmentContract.class));
verify(appointmentService, never()).create(any(), any(), any());
```

Arquivo:

```text
src/test/java/com/agendamento/smart/service/ServicePackageServiceTest.java
```

Foi adicionado o teste `basicListingRejectsAUnitOutsideItsSessionScope`, que:

1. cria uma clínica com unidade própria e unidade externa;
2. cria um usuário `UserRole.USER` vinculado à unidade própria;
3. configura `UnitScopeService.requireSingleAllowedUnitId` para a unidade
   própria;
4. solicita a unidade externa;
5. espera `TENANT_RESOURCE_NOT_FOUND`;
6. verifica que o repository de pacotes não é consultado.

### 6.7 Teste MockMvc de isolamento do catálogo

Arquivo:

```text
src/test/java/com/agendamento/smart/controller/servicepackage/ServicePackageControllerIntegrationTest.java
```

O teste existente de isolamento foi atualizado. Antes ele esperava que o
usuário BASIC fosse proibido de fazer `GET /api/service-packages`. Depois da
change, ele verifica que:

```java
mockMvc.perform(get("/api/service-packages")
                .header("Authorization", bearer(owner.attendant())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(1)))
        .andExpect(jsonPath("$.content[0].id").value(packageId));

mockMvc.perform(get("/api/service-packages")
                .header("Authorization", bearer(owner.attendant()))
                .param("unitId", anotherClinic.unit().getId().toString()))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code")
                .value("TENANT_RESOURCE_NOT_FOUND"));

mockMvc.perform(post("/api/service-packages")
                .header("Authorization", bearer(owner.attendant()))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsBytes(
                        request(owner, "Pacote BASIC", List.of("MONDAY")))))
        .andExpect(status().isForbidden());
```

O teste prova as três regras do endpoint:

- leitura da própria unidade é permitida;
- tentativa de leitura externa não expõe dados;
- criação continua proibida para o usuário básico.

### 6.8 READMEs atualizados no back-end

Foram atualizados ou criados os seguintes documentos:

```text
src/main/java/com/agendamento/smart/controller/servicepackage/README.md
src/main/java/com/agendamento/smart/controller/packageappointment/README.md
src/main/java/com/agendamento/smart/dtos/servicepackage/README.md
src/main/java/com/agendamento/smart/service/README.md
```

Os textos registram:

- `GET /api/service-packages` como leitura operacional autenticada;
- restrição de `USER` à unidade da sessão e a pacotes ativos;
- mutations e detalhe administrativo exclusivos de ADMIN;
- `unitId` obrigatório no preview e confirm;
- validação de pacote, paciente e unidade;
- fingerprint composto também pela unidade;
- consulta de contrato protegida pelo escopo da unidade;
- ausência de migration para esta alteração.

## 7. Fluxo completo passo a passo

### Passo 1 — abrir o diálogo

O usuário aciona o botão global `Agendamento de Pacotes`. O componente abre o
diálogo e dispara apenas o catálogo de unidades:

```tsx
const unitsQuery = useGetUnitsQuery(undefined, { skip: !open })
```

As queries de pacientes e pacotes permanecem suspensas porque ainda não existe
`effectiveUnitId`.

### Passo 2 — determinar a unidade

- ADMIN escolhe uma opção do `<select>`.
- BASIC recebe `session.activeUnitId` depois de o catálogo de unidades carregar.
- Se a unidade BASIC não estiver disponível, o diálogo exibe alerta e mantém o
  fluxo bloqueado.

### Passo 3 — carregar pacientes e pacotes

Com `effectiveUnitId` preenchida, as duas queries são habilitadas:

```tsx
useGetAppointmentPatientsQuery(effectiveUnitId, {
  skip: !open || !effectiveUnitId,
})

useGetServicePackagesQuery(
  { active: true, unitId: effectiveUnitId || undefined },
  { skip: !open || !effectiveUnitId },
)
```

O servidor também aplica o filtro e a autorização. O front-end não carrega
todos os pacientes para filtrar somente no render.

### Passo 4 — selecionar paciente e pacote

Os selects ficam habilitados somente com unidade válida. A escolha do pacote
preenche os dias da definição como sugestão da contratação, mas os dias podem
ser ajustados para aquela contratação.

Ao mudar paciente ou pacote, a prévia anterior é descartada.

### Passo 5 — informar data, horário, profissional e dias

Data, horário, profissional e dias são os mesmos dados já existentes no fluxo de
pacote. Qualquer alteração invalida a prévia porque modifica o contexto usado
para o cálculo das sessões.

### Passo 6 — gerar preview

O front-end monta o payload com `unitId`. O back-end executa, nessa ordem:

1. verifica a unidade no escopo do usuário;
2. carrega o pacote na clínica;
3. verifica que o pacote está ativo;
4. verifica que o pacote pertence à unidade enviada;
5. carrega o paciente na clínica;
6. verifica o vínculo paciente-unidade;
7. calcula as sessões no fuso da unidade;
8. devolve a prévia, incluindo `unitId` e fingerprint.

### Passo 7 — confirmar

O front-end somente mostra confirmação quando a prévia ainda corresponde ao
estado atual. A mutation envia o mesmo body, `Idempotency-Key` e fingerprint.

O back-end:

1. exige `Idempotency-Key`;
2. verifica eventual contratação idempotente existente;
3. recalcula a prévia e repete todas as validações;
4. compara o fingerprint recebido;
5. resolve novamente o pacote na unidade autorizada;
6. persiste o contrato com a unidade da definição;
7. cria os agendamentos individuais usando a mesma unidade;
8. retorna o contrato, IDs dos agendamentos e a prévia.

### Passo 8 — trocar unidade

Quando ADMIN troca a unidade, o componente:

```tsx
setUnitId(nextUnitId)
setPatientId('')
setPackageId('')
setEffectiveWeekDays([])
previewState.reset()
```

As queries são recalculadas com a nova unidade e qualquer prévia antiga deixa de
ser exibida.

## 8. Arquivos envolvidos

### Front-end

| Arquivo | Tipo | Responsabilidade da alteração |
| --- | --- | --- |
| `src/features/packages/api/package-appointments.ts` | Código | Torna `unitId` obrigatório no input de preview/confirm |
| `src/features/packages/components/package-appointment-dialog.tsx` | Código | Implementa unidade, queries dependentes, limpeza e bloqueios |
| `src/features/appointments/api/appointments.ts` | Código reutilizado | Fornece query de pacientes por `unitId` |
| `src/test/server.ts` | Teste | Adiciona handler padrão de pacotes |
| `src/features/packages/__tests__/package-appointment-dialog.integration.test.tsx` | Teste novo | Cobre ADMIN, BASIC, troca de unidade, payloads e catálogo vazio |
| `src/features/packages/README.md` | Documentação | Registra o novo fluxo e a autoridade da API |
| `openspec/changes/selecionar-unidade-agendamento-por-pacote/` | Especificação | Proposal, spec delta, design e tasks do front-end |

### Back-end

| Arquivo | Tipo | Responsabilidade da alteração |
| --- | --- | --- |
| `src/main/java/com/agendamento/smart/dtos/packageappointment/PackageAppointmentRequest.java` | Código | Inclui `unitId` obrigatório |
| `src/main/java/com/agendamento/smart/controller/servicepackage/ServicePackageController.java` | Código | Separa leitura autenticada de mutações ADMIN |
| `src/main/java/com/agendamento/smart/service/ServicePackageService.java` | Código | Aplica escopo de unidade e força pacotes ativos para USER |
| `src/main/java/com/agendamento/smart/service/packageappointment/PackageAppointmentService.java` | Código | Valida unidade, pacote, paciente, contrato e fingerprint |
| `src/test/java/com/agendamento/smart/service/packageappointment/PackageAppointmentServiceTest.java` | Teste novo | Cobre compatibilidade, fingerprint e ausência de persistência parcial |
| `src/test/java/com/agendamento/smart/service/ServicePackageServiceTest.java` | Teste | Cobre leitura BASIC fora do escopo |
| `src/test/java/com/agendamento/smart/controller/servicepackage/ServicePackageControllerIntegrationTest.java` | Teste | Cobre isolamento MockMvc com PostgreSQL |
| `src/main/java/com/agendamento/smart/controller/servicepackage/README.md` | Documentação | Documenta leitura operacional e gestão ADMIN |
| `src/main/java/com/agendamento/smart/controller/packageappointment/README.md` | Documentação nova | Documenta endpoints de agendamento por pacote |
| `src/main/java/com/agendamento/smart/dtos/servicepackage/README.md` | Documentação | Documenta `PackageAppointmentRequest.unitId` |
| `src/main/java/com/agendamento/smart/service/README.md` | Documentação | Documenta regras de service e escopo |
| `openspec/changes/selecionar-unidade-agendamento-por-pacote/` | Especificação | Proposal, spec delta, design e tasks do back-end |

## 9. Estratégias de segurança e integridade

### 9.1 Front-end não é autorização

O select desabilitado para BASIC, os filtros locais e os `skip` das queries são
controles de experiência e redução de chamadas inválidas. Uma requisição pode
ser alterada fora do navegador. Por isso, o back-end sempre deriva a clínica da
autenticação e compara a unidade informada com `UnitScopeService`.

### 9.2 Não inferir unidade de ADMIN

Se ADMIN abrir o fluxo sem selecionar unidade, o sistema não escolhe uma unidade
automática. Isso evita gerar uma prévia em contexto diferente daquele escolhido
explicitamente.

### 9.3 Não trocar a unidade BASIC automaticamente

Se `activeUnitId` não estiver no catálogo autorizado, o fluxo é bloqueado. A
interface informa o problema para que a associação de sessão seja corrigida,
sem escolher outra unidade no lugar do usuário.

### 9.4 Não expor recurso externo

As consultas e mutações usam `TENANT_RESOURCE_NOT_FOUND` para combinações fora
do escopo. A API não diferencia, na resposta pública, entre recurso inexistente
e recurso pertencente a outra unidade quando essa distinção revelaria dados.

### 9.5 Confirmação atômica do contexto

A confirmação é transacional e chama `preview` novamente antes de persistir. Se
unidade, paciente, pacote ou fingerprint estiverem incompatíveis, o método sai
antes de `contractRepository.saveAndFlush` e antes do loop que cria
agendamentos.

### 9.6 Compatibilidade com o fluxo manual

O endpoint e os adaptadores existentes de agendamento manual não foram
alterados. O agendamento por pacote passou a reutilizar a mesma query de
pacientes por unidade, mas as regras de criação manual permanecem separadas.

## 10. Verificações executadas

### 10.1 Front-end

Foram executadas as verificações da change:

```bash
npm run lint
npm run build
```

Também foram executadas as suítes direcionadas:

```bash
npm test -- --run src/features/packages/__tests__/package-appointment-dialog.integration.test.tsx
npm test -- --run src/features/packages src/features/appointments
```

Resultados registrados:

- suíte combinada de pacotes, topbar e página: `18` testes aprovados;
- suíte combinada do diálogo de pacotes e agendamento manual: `40` testes
  aprovados;
- `npm run lint`: aprovado;
- `npm run build`: aprovado;
- `openspec validate selecionar-unidade-agendamento-por-pacote --strict`:
  aprovado.

### 10.2 Back-end

Testes unitários direcionados:

```bash
./mvnw -q -Dtest=ServicePackageServiceTest,PackageAppointmentServiceTest test
```

Teste MockMvc específico:

```bash
./mvnw -q -Dtest=ServicePackageControllerIntegrationTest test
```

Verificação completa:

```bash
./mvnw -q clean verify
```

O `clean verify` executou compilação, testes unitários, testes de integração
com PostgreSQL via Testcontainers e empacotamento sem falha. A execução também
validou as migrations existentes, que permaneceram na versão atual sem nova
migration.

Validação OpenSpec:

```bash
openspec validate selecionar-unidade-agendamento-por-pacote --strict
```

Resultado:

```text
Change 'selecionar-unidade-agendamento-por-pacote' is valid
```

O rastreamento da change de back-end terminou com `6/6` tarefas concluídas.

## 11. Decisões de implementação

### Decisão 1 — unidade como estado próprio do diálogo

A unidade não foi derivada tardiamente do pacote selecionado. Ela é escolhida
ou derivada primeiro, porque o paciente precisa ser filtrado antes de o pacote
ser escolhido.

### Decisão 2 — queries dependentes

Carregar todos os pacientes e filtrar somente no render foi rejeitado. Além de
trazer dados fora do contexto, isso deixaria o cliente divergente do endpoint
manual e não impediria uma requisição forjada.

### Decisão 3 — separar autorização do GET

Remover a proteção administrativa sem adicionar regra no service seria
inseguro. A proteção foi retirada da classe, mas a autorização foi recolocada
nas mutations e a leitura BASIC recebeu escopo obrigatório no service.

### Decisão 4 — incluir a unidade no fingerprint

O fingerprint representa o contexto que será confirmado. Sem `unitId`, duas
prévias iguais em unidades diferentes poderiam ser tratadas como equivalentes.

### Decisão 5 — sem alteração de schema

O contrato de pacote já persistia a unidade em `PACKAGE_CONTRACT` e os
agendamentos individuais já recebiam unidade. A change alterou contrato HTTP e
validação, não estrutura de banco.

## 12. Pendências e publicação

- A change de front-end e a change de back-end devem ser publicadas em conjunto,
  porque o front-end passou a enviar `unitId` obrigatório.
- A change de back-end registra como follow-up a integração com
  `agendamento-automatico-por-pacotes` antes da publicação conjunta.
- Nenhuma change foi arquivada neste documento; o arquivamento deve ocorrer
  somente após a revisão do contrato HTTP e da integração com a capability de
  contratação por pacotes.
- A change não cria unidade, não altera associação de usuário, não muda regras
  de disponibilidade e não altera o agendamento manual.

## 13. Referências diretas

Front-end:

- `src/features/packages/components/package-appointment-dialog.tsx`
- `src/features/packages/api/package-appointments.ts`
- `src/features/appointments/api/appointments.ts`
- `src/features/packages/__tests__/package-appointment-dialog.integration.test.tsx`
- `openspec/changes/selecionar-unidade-agendamento-por-pacote/`

Back-end:

- `src/main/java/com/agendamento/smart/dtos/packageappointment/PackageAppointmentRequest.java`
- `src/main/java/com/agendamento/smart/controller/servicepackage/ServicePackageController.java`
- `src/main/java/com/agendamento/smart/service/ServicePackageService.java`
- `src/main/java/com/agendamento/smart/service/packageappointment/PackageAppointmentService.java`
- `src/test/java/com/agendamento/smart/service/packageappointment/PackageAppointmentServiceTest.java`
- `src/test/java/com/agendamento/smart/controller/servicepackage/ServicePackageControllerIntegrationTest.java`
- `openspec/changes/selecionar-unidade-agendamento-por-pacote/`
