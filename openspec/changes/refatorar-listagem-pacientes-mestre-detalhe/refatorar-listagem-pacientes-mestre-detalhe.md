# Guia de implementação frontend — refatorar-listagem-pacientes-mestre-detalhe

## 1. Objetivo da documentação

Este documento descreve, passo a passo, a implementação frontend da change `refatorar-listagem-pacientes-mestre-detalhe`.

A change atualiza a listagem de pacientes para seguir o mesmo padrão visual e estrutural da listagem de pacotes, que foi previamente refatorada pelas changes:

- `refatorar-listagem-pacotes-mestre-detalhe`;
- `ajustar-container-e-detalhes-modal-pacotes`.

O resultado é uma tela de pacientes organizada no padrão mestre-detalhe:

- a listagem continua sendo a área mestre;
- a seleção de uma linha abre o detalhe do paciente;
- o detalhe aparece em modal;
- a página utiliza containers visuais globais;
- o modal de cadastro permanece separado do detalhe;
- a tabela é isolada em um componente próprio;
- a API aceita tanto o formato paginado atual quanto o formato legado em array;
- a seleção respeita o ciclo de vida da paginação, carregamento e troca de filtros.

Este material foi escrito como um guia técnico de implementação. Ele registra:

1. o problema anterior;
2. a estrutura adotada;
3. os arquivos novos e alterados;
4. os códigos principais;
5. a comparação entre o comportamento anterior e o atual;
6. a justificativa das decisões;
7. os testes e validações executados;
8. as limitações que permanecem fora do escopo.

---

## 2. Contexto funcional

A tela de pacientes precisava se comportar como a tela de pacotes:

- mesma largura máxima de conteúdo;
- mesmo espaçamento vertical;
- mesmo cabeçalho de página;
- mesmo tratamento visual da tabela;
- mesma organização de loading, erro e estado vazio;
- seleção por linha;
- modal de detalhe reutilizável;
- retorno de foco para o elemento que abriu o modal;
- composição visual baseada em componentes globais.

Antes da change, a página de pacientes concentrava em um único arquivo:

- o container externo;
- o cabeçalho;
- os filtros;
- a tabela;
- os estados de carregamento;
- o tratamento de erro;
- a paginação;
- a seleção;
- a abertura do modal;
- o cadastro de paciente.

Essa concentração dificultava a reutilização do padrão da tela de pacotes e deixava a tabela de pacientes sem um componente dedicado.

---

## 3. Estado inicial e problemas encontrados

### 3.1. Estrutura anterior da página

Antes da refatoração, a página de pacientes renderizava diretamente a estrutura visual:

~~~tsx
<main className="...">
  <section className="...">
    <header className="...">
      <h1>Pacientes</h1>
      <p>...</p>
      <AddPatientModal />
    </header>

    <PatientFilters ... />

    <section className="...">
      <table>
        ...
      </table>

      <Pagination ... />
    </section>
  </section>
</main>
~~~

Essa abordagem funcionava, mas fazia a página conhecer detalhes visuais que deveriam ser padronizados em componentes globais.

### 3.2. Tabela acoplada à página

A tabela estava escrita diretamente no componente de página. Isso fazia com que a página tivesse responsabilidade sobre:

- cabeçalho da tabela;
- linhas de loading;
- mensagem de lista vazia;
- mapeamento dos pacientes;
- acessibilidade da tabela;
- comportamento de seleção;
- estado de atualização.

Como consequência, era mais difícil garantir paridade com a listagem de pacotes.

### 3.3. Linhas sem interação mestre-detalhe

As ações de detalhes, edição e desativação estavam desabilitadas ou eram apresentadas como ações futuras. A linha não funcionava como uma unidade selecionável e não existia um fluxo completo de abertura do detalhe.

### 3.4. Contrato de API rígido

A API de pacientes considerava apenas o formato paginado:

~~~ts
getPatientPage: builder.query<PatientListResponse, PatientPageRequest>({
  query: ({ page, size }) => ({
    url: '/patient',
    params: { page, size },
  }),
})
~~~

Esse contrato era frágil porque respostas legadas em array poderiam quebrar a normalização da tela ou produzir comportamento incompatível com a paginação.

### 3.5. Ausência de um modal de detalhe

A tela tinha o modal de cadastro, mas não possuía um componente dedicado para apresentar:

- código;
- status;
- data de cadastro;
- serviço principal;
- unidades vinculadas.

O modal de cadastro e o modal de detalhe são responsabilidades diferentes e passaram a ser representados por componentes diferentes.

---

## 4. Arquivos criados

A implementação criou os seguintes arquivos principais:

~~~text
src/components/page-shell.tsx
src/components/data-table-shell.tsx
src/components/__tests__/page-shell.test.tsx
src/features/patients/components/patient-table.tsx
src/features/patients/components/patient-detail-modal.tsx
src/features/patients/components/patient-form-modal.tsx
~~~

Também foram atualizados:

~~~text
src/components/README.md
src/features/packages/pages/packages-page.tsx
src/features/packages/README.md
src/features/patients/api/patients.ts
src/features/patients/api/patients.test.ts
src/features/patients/components/add-patient-modal.tsx
src/features/patients/components/patient-table-rows.tsx
src/features/patients/pages/patients-page.tsx
src/features/patients/README.md
~~~

---

## 5. Componentes globais

A análise das changes de pacotes mostrou um padrão comum de composição:

1. container geral da página;
2. cabeçalho padronizado;
3. card visual para tabela;
4. conteúdo de domínio dentro do card;
5. paginação fornecida pelo recurso específico.

Esse padrão foi extraído para componentes globais.

### 5.1. PageContainer

Arquivo: `src/components/page-shell.tsx`

O `PageContainer` é responsável pelo enquadramento visual da página.

~~~tsx
export type PageContainerProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function PageContainer({
  children,
  className,
  contentClassName,
}: PageContainerProps) {
  return (
    <main
      className={cn(
        'min-h-full overflow-x-hidden bg-slate-50/70 px-4 pt-20 pb-8 sm:px-6 lg:px-8',
        className,
      )}
    >
      <section
        className={cn(
          'mx-auto w-full max-w-[2048px] space-y-6',
          contentClassName,
        )}
      >
        {children}
      </section>
    </main>
  )
}
~~~

#### O que existia antes

Cada página declarava as próprias classes de layout:

~~~tsx
<main className="min-h-full overflow-x-hidden bg-slate-50/70 px-4 pt-20 pb-8 ...">
  <section className="mx-auto w-full max-w-[2048px] space-y-6">
    ...
  </section>
</main>
~~~

#### O que existe agora

As páginas utilizam:

~~~tsx
<PageContainer contentClassName="max-w-[2048px]">
  ...
</PageContainer>
~~~

#### Explicação

O componente centraliza:

- fundo da área de conteúdo;
- padding horizontal responsivo;
- padding superior para a área principal;
- padding inferior;
- largura máxima;
- espaçamento vertical entre os blocos.

Os parâmetros `className` e `contentClassName` permitem ajustes locais sem duplicar toda a estrutura.

O componente não conhece:

- pacientes;
- pacotes;
- filtros;
- chamadas HTTP;
- regras de negócio;
- permissões;
- tenancy.

Ele é somente um shell visual.

### 5.2. PageHeader

O `PageHeader` padroniza o título e as ações da página.

~~~tsx
export type PageHeaderProps = {
  title: string
  description?: string
  icon?: LucideIcon
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-center md:justify-between',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <Icon aria-hidden="true" className="size-5" />
          </div>
        ) : null}

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            {title}
          </h1>

          {description ? (
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          ) : null}
        </div>
      </div>

      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  )
}
~~~

#### Antes

O cabeçalho de pacientes era construído diretamente na página:

~~~tsx
<header className="flex ...">
  <div>
    <h1>Pacientes</h1>
    <p>Gerencie os pacientes cadastrados.</p>
  </div>

  <AddPatientModal />
</header>
~~~

#### Agora

A página usa composição:

~~~tsx
<PageHeader
  title="Pacientes"
  description="Gerencie os pacientes cadastrados."
  icon={UsersRound}
  actions={<PatientFormModal />}
/>
~~~

#### Explicação

O `PageHeader` permite que cada feature informe apenas seu conteúdo:

- título;
- descrição;
- ícone;
- ações.

A regra visual é compartilhada. A ação continua sendo específica da feature e entra pelo slot `actions`.

O cabeçalho não sabe que o botão abre um formulário. Ele somente reserva a área correta para a ação.

### 5.3. DataTableCard

Arquivo: `src/components/data-table-shell.tsx`

O `DataTableCard` fornece o enquadramento visual de tabelas e listas.

~~~tsx
export type DataTableCardProps = {
  children: ReactNode
  footer?: ReactNode
  ariaLabel: string
  className?: string
}

export function DataTableCard({
  children,
  footer,
  ariaLabel,
  className,
}: DataTableCardProps) {
  return (
    <section
      aria-label={ariaLabel}
      className={cn(
        'overflow-hidden rounded-xl border bg-white shadow-sm',
        className,
      )}
    >
      {children}
      {footer ? <div>{footer}</div> : null}
    </section>
  )
}
~~~

#### Antes

A listagem utilizava um `section` local:

~~~tsx
<section className="overflow-hidden rounded-xl border bg-white shadow-sm">
  <PatientTable ... />
  <Pagination ... />
</section>
~~~

#### Agora

A composição passou a ser:

~~~tsx
<DataTableCard
  ariaLabel="Tabela de pacientes"
  footer={
    <Pagination
      page={pageIndex}
      totalPages={patientPage.totalPages}
      onPageChange={setPageIndex}
    />
  }
>
  <PatientTable
    patients={patientPage.content}
    selectedId={selectedId}
    isLoading={isLoading}
    isFetching={isFetching}
    onSelect={selectPatient}
  />
</DataTableCard>
~~~

#### Explicação

O card não implementa uma tabela e não possui paginação própria. Ele apenas:

- cria o container visual;
- aplica borda, radius e sombra;
- permite um conteúdo principal;
- permite um rodapé opcional;
- expõe um nome acessível via `aria-label`.

Essa separação é importante porque a paginação continua sendo responsabilidade do recurso. O componente global não precisa conhecer o formato de páginas da API.

### 5.4. Critério para components globais

Os componentes foram extraídos para o escopo global porque:

- aparecem em mais de uma listagem;
- têm comportamento puramente visual;
- não conhecem o domínio;
- não dependem da API;
- aceitam conteúdo por composição;
- mantêm a mesma linguagem visual entre pacotes e pacientes.

Não foram extraídos para o global:

- `PatientTable`;
- `PatientTableRows`;
- `PatientDetailModal`;
- `PatientFormModal`;
- `PackagePagination`.

Esses componentes possuem comportamento ou dados próprios do domínio.

---

## 6. Migração da listagem de pacotes

A implementação utilizou a tela de pacotes como referência de comportamento e estrutura.

Arquivo atualizado: `src/features/packages/pages/packages-page.tsx`.

### Antes

A página de pacotes possuía a estrutura visual diretamente no arquivo:

~~~tsx
<main className="...">
  <section className="...">
    <header className="...">
      ...
    </header>

    <section className="...">
      ...
    </section>
  </section>
</main>
~~~

### Depois

A mesma tela foi migrada para os componentes globais:

~~~tsx
<PageContainer>
  <PageHeader
    title="Pacotes"
    description="Gerencie os pacotes de serviços."
    icon={Package}
    actions={<PackageFormModal />}
  />

  <DataTableCard
    ariaLabel="Tabela de pacotes"
    footer={<PackagePagination ... />}
  >
    <PackageTable ... />
  </DataTableCard>
</PageContainer>
~~~

### Explicação

A migração de pacotes serviu como validação prática do padrão:

- o visual ficou concentrado nos componentes globais;
- a tabela permaneceu específica da feature;
- a paginação permaneceu específica da feature;
- as mutações e regras de negócio foram preservadas;
- a tela de pacientes passou a utilizar exatamente a mesma base de layout.

A mudança não alterou o contrato funcional de pacotes. O objetivo foi consolidar o padrão que pacientes deveria seguir.

---

## 7. Compatibilidade da API de pacientes

Arquivo: `src/features/patients/api/patients.ts`.

### 7.1. Problema anterior

A query esperava diretamente um objeto paginado:

~~~tsx
getPatientPage: builder.query<PatientListResponse, PatientPageRequest>({
  query: ({ page, size }) => ({
    url: '/patient',
    params: { page, size },
  }),
})
~~~

Se o backend retornasse uma lista legada, a tela não teria uma estrutura segura para renderizar.

### 7.2. Normalização adicionada

Foi criada uma normalização defensiva:

~~~tsx
type PageFallback = {
  page: number
  size: number
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function normalizePatientPage(
  value: unknown,
  fallback: PageFallback = { page: 0, size: 5 },
): PatientListResponse {
  if (Array.isArray(value)) {
    return {
      content: value as PatientListItem[],
      page: fallback.page,
      size: fallback.size,
      totalElements: value.length,
      totalPages: value.length > 0 ? 1 : 0,
      first: fallback.page === 0,
      last: true,
    }
  }

  const record = asRecord(value)
  const content = Array.isArray(record?.content)
    ? (record.content as PatientListItem[])
    : []

  return {
    content,
    page: numberOr(record?.page, fallback.page),
    size: numberOr(record?.size, fallback.size),
    totalElements: numberOr(record?.totalElements, content.length),
    totalPages: numberOr(
      record?.totalPages,
      content.length > 0 ? 1 : 0,
    ),
    first: typeof record?.first === 'boolean'
      ? record.first
      : fallback.page === 0,
    last: typeof record?.last === 'boolean'
      ? record.last
      : true,
  }
}
~~~

### 7.3. Transformação na query

A query passou a normalizar a resposta:

~~~tsx
getPatientPage: builder.query<PatientListResponse, PatientPageRequest>({
  query: ({ page, size }) => ({
    url: '/patient',
    params: { page, size },
  }),
  transformResponse: (value, _meta, argument) =>
    normalizePatientPage(value, {
      page: argument.page,
      size: argument.size,
    }),
  providesTags: (result) =>
    result
      ? [
          { type: 'PatientCatalog', id: 'LIST' },
          ...result.content.map((patient) => ({
            type: 'PatientCatalog' as const,
            id: patient.id,
          })),
        ]
      : [{ type: 'PatientCatalog', id: 'LIST' }],
})
~~~

### 7.4. O que a normalização garante

A tela recebe sempre o mesmo formato interno:

~~~ts
type PatientListResponse = {
  content: PatientListItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}
~~~

A normalização trata:

- resposta paginada;
- resposta em array;
- objeto com `content`;
- resposta vazia;
- campos numéricos ausentes;
- flags de primeira e última página ausentes.

### 7.5. O que a normalização não faz

Ela não fabrica páginas extras para um array legado.

Quando a resposta é um array, a normalização cria uma única página coerente com o conteúdo recebido. Isso evita que a interface mostre páginas que não existem de fato.

---

## 8. Testes da normalização da API

Arquivo: `src/features/patients/api/patients.test.ts`.

Foram adicionados testes para os formatos suportados.

### Resposta paginada

~~~tsx
it('preserves a paginated response', () => {
  const response = normalizePatientPage({
    content: [patient],
    page: 1,
    size: 5,
    totalElements: 6,
    totalPages: 2,
    first: false,
    last: true,
  })

  expect(response).toEqual({
    content: [patient],
    page: 1,
    size: 5,
    totalElements: 6,
    totalPages: 2,
    first: false,
    last: true,
  })
})
~~~

### Resposta legada em array

~~~tsx
it('normalizes a legacy array response', () => {
  const response = normalizePatientPage([patient], {
    page: 0,
    size: 5,
  })

  expect(response.content).toEqual([patient])
  expect(response.page).toBe(0)
  expect(response.size).toBe(5)
  expect(response.totalElements).toBe(1)
  expect(response.totalPages).toBe(1)
  expect(response.first).toBe(true)
  expect(response.last).toBe(true)
})
~~~

### Resposta vazia

~~~tsx
it('normalizes an empty response', () => {
  const response = normalizePatientPage(null, {
    page: 0,
    size: 5,
  })

  expect(response.content).toEqual([])
  expect(response.totalElements).toBe(0)
  expect(response.totalPages).toBe(0)
})
~~~

---

## 9. Tipos do componente de tabela

Arquivo: `src/features/patients/components/patient-table-rows.tsx`.

### Antes

A linha recebia somente o paciente:

~~~tsx
type PatientTableRowsProps = {
  patient: PatientListItem
}
~~~

### Agora

A linha recebe a informação de seleção e o callback de abertura do detalhe:

~~~tsx
type PatientTableRowsProps = {
  patient: PatientListItem
  selected?: boolean
  onSelect(patient: PatientListItem, trigger: HTMLElement): void
}
~~~

### Explicação

O parâmetro `trigger` é o elemento que iniciou a interação. Ele é usado para restaurar o foco quando o modal for fechado.

Essa abordagem preserva acessibilidade de teclado e permite que a página mestre controle o ciclo de vida do detalhe.

---

## 10. Componente PatientTable

Arquivo: `src/features/patients/components/patient-table.tsx`.

### 10.1. Responsabilidade

O `PatientTable` passou a ser responsável exclusivamente pela representação da tabela:

- cabeçalho;
- loading;
- estado vazio;
- linhas;
- estado selecionado;
- estado de atualização.

Ele não controla:

- página atual;
- filtros;
- abertura do modal;
- dados da API;
- seleção persistida;
- chamada de cadastro.

### 10.2. Interface

~~~tsx
export type PatientTableProps = {
  patients: PatientListItem[]
  selectedId?: string
  isLoading?: boolean
  isFetching?: boolean
  onSelect(patient: PatientListItem, trigger: HTMLElement): void
}
~~~

### 10.3. Estrutura principal

~~~tsx
export function PatientTable({
  patients,
  selectedId,
  isLoading = false,
  isFetching = false,
  onSelect,
}: PatientTableProps) {
  return (
    <div className="overflow-x-auto">
      <table
        aria-busy={isFetching}
        className="w-full min-w-[820px] text-left text-sm"
      >
        <thead>
          <tr>
            <th scope="col">Código</th>
            <th scope="col">Paciente</th>
            <th scope="col">Serviço principal</th>
            <th scope="col">Status</th>
            <th scope="col">Cadastro</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            <PatientTableLoadingRows />
          ) : patients.length === 0 ? (
            <PatientTableEmptyState />
          ) : (
            patients.map((patient) => (
              <PatientTableRows
                key={patient.id}
                patient={patient}
                selected={patient.id === selectedId}
                onSelect={onSelect}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
~~~

### 10.4. Loading

O loading utiliza cinco linhas de skeleton para preservar a forma visual da tabela:

~~~tsx
function PatientTableLoadingRows() {
  return Array.from({ length: 5 }, (_, index) => (
    <tr key={index}>
      <td colSpan={6}>
        <Skeleton className="h-10 w-full" />
      </td>
    </tr>
  ))
}
~~~

Isso evita que a tabela desapareça durante a busca inicial.

### 10.5. Estado vazio

Quando a busca termina sem pacientes, a tabela mantém seus cabeçalhos e apresenta uma mensagem de estado vazio.

Esse comportamento é preferível a retornar somente um texto fora do card porque:

- mantém a relação semântica com a tabela;
- preserva o espaço visual;
- mantém o alinhamento do componente;
- é consistente com a listagem de pacotes.

### 10.6. Atualização em background

O `aria-busy` recebe `isFetching`:

~~~tsx
<table aria-busy={isFetching}>
~~~

Assim, uma troca de página ou atualização de filtro pode continuar exibindo os dados atuais enquanto a nova requisição ocorre, sem desmontar a estrutura da tabela.

---

## 11. Atualização da linha PatientTableRows

Arquivo: `src/features/patients/components/patient-table-rows.tsx`.

### 11.1. Antes

A linha apresentava ações desabilitadas:

~~~tsx
<button disabled aria-label="Editar paciente">
  <Pencil />
</button>

<button disabled aria-label="Desativar paciente">
  <Trash2 />
</button>
~~~

A interação de detalhe não estava concluída.

### 11.2. Depois

A linha passou a ser selecionável:

~~~tsx
<tr
  tabIndex={0}
  aria-selected={selected}
  data-state={selected ? 'selected' : undefined}
  onKeyDown={handleKeyDown}
>
  <td>{patient.code}</td>
  <td>
    <span>{patient.name}</span>
    <span>{patient.initials}</span>
  </td>
  <td>{patient.primaryService ?? '—'}</td>
  <td>{patient.status}</td>
  <td>{formatDate(patient.createdAt)}</td>
  <td>
    <button
      type="button"
      aria-label={`Detalhes de ${patient.name}`}
      onClick={handleDetailsClick}
    >
      <ArrowRight aria-hidden="true" />
    </button>
  </td>
</tr>
~~~

Na coluna de ações que ainda não possui contrato funcional, é exibido:

~~~tsx
<span aria-hidden="true">—</span>
~~~

### 11.3. Acessibilidade por teclado

A linha trata Enter e Space:

~~~tsx
function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return
  }

  event.preventDefault()
  onSelect(patient, event.currentTarget)
}
~~~

O botão de detalhes também informa explicitamente o nome do paciente:

~~~tsx
aria-label={`Detalhes de ${patient.name}`}
~~~

### 11.4. Seleção visual

A linha selecionada recebe:

- `aria-selected="true"`;
- `data-state="selected"`;
- estilo visual associado ao estado.

O estado é derivado da comparação:

~~~tsx
patient.id === selectedId
~~~

A tabela não mantém uma cópia independente do paciente selecionado. A página é a fonte de verdade.

---

## 12. Orquestração da página de pacientes

Arquivo: `src/features/patients/pages/patients-page.tsx`.

A página passou a atuar como orquestradora. Ela conecta:

- filtros;
- query;
- tabela;
- seleção;
- modal;
- paginação;
- cadastro.

### 12.1. Estados adicionados

~~~tsx
const [pageIndex, setPageIndex] = useState(0)
const [filters, setFilters] = useState<PatientFilters>(initialFilters)
const [selectedId, setSelectedId] = useState<string | undefined>()
const [detailOpen, setDetailOpen] = useState(false)
const [detailReturnFocus, setDetailReturnFocus] =
  useState<HTMLElement | null>(null)
~~~

### 12.2. Paciente selecionado

O paciente selecionado é derivado da página atual:

~~~tsx
const selectedPatient = patients.find(
  (patient) => patient.id === selectedId,
) ?? null
~~~

Isso garante que o modal utilize o mesmo objeto já carregado na tabela.

Não foi criada uma nova requisição de detalhe porque o contrato atual já fornece os dados necessários para o modal desta change.

### 12.3. Limpeza quando o paciente sai da página

Quando o paciente selecionado deixa de existir na página atual, a seleção é limpa:

~~~tsx
useEffect(() => {
  if (!selectedId) {
    return
  }

  const stillVisible = patients.some(
    (patient) => patient.id === selectedId,
  )

  if (stillVisible) {
    return
  }

  setSelectedId(undefined)
  setDetailOpen(false)
  setDetailReturnFocus(null)
}, [patients, selectedId])
~~~

Esse efeito evita:

- modal apontando para um paciente que não está mais na tabela;
- seleção visual stale;
- detalhes antigos após paginação;
- inconsistência após mudança de filtro.

### 12.4. Aplicação de filtros

Ao aplicar filtros, a página volta para a primeira página e limpa a seleção:

~~~tsx
function handleApplyFilters(nextFilters: PatientFilters) {
  setFilters(nextFilters)
  setPageIndex(0)
  setSelectedId(undefined)
  setDetailOpen(false)
  setDetailReturnFocus(null)
}
~~~

A mesma regra é aplicada ao limpar filtros.

### 12.5. Seleção mestre-detalhe

A função de seleção recebe o paciente e o elemento que iniciou a ação:

~~~tsx
function selectPatient(
  patient: PatientListItem,
  trigger: HTMLElement,
) {
  setSelectedId(patient.id)
  setDetailReturnFocus(trigger)
  setDetailOpen(true)
}
~~~

Essa função concentra o fluxo de abertura do detalhe sem colocar lógica de modal dentro da linha.

### 12.6. Restauração de foco

Quando o modal fecha, o foco retorna ao elemento que o abriu:

~~~tsx
function handleDetailOpenChange(nextOpen: boolean) {
  setDetailOpen(nextOpen)

  if (nextOpen || !detailReturnFocus) {
    return
  }

  requestAnimationFrame(() => {
    detailReturnFocus.focus()
    setDetailReturnFocus(null)
  })
}
~~~

O `requestAnimationFrame` permite que a desmontagem e as alterações de foco do Dialog sejam concluídas antes do foco retornar à tabela.

### 12.7. Composição final da página

~~~tsx
<PageContainer contentClassName="max-w-[2048px]">
  <PageHeader
    title="Pacientes"
    description="Gerencie os pacientes cadastrados."
    icon={UsersRound}
    actions={<PatientFormModal />}
  />

  <PatientFilters
    filters={filters}
    onApply={handleApplyFilters}
    onClear={handleClearFilters}
  />

  {servicesError ? (
    <Alert variant="destructive">
      Não foi possível carregar os serviços.
    </Alert>
  ) : null}

  {patientsError ? (
    <Alert variant="destructive">
      Não foi possível carregar os pacientes.
      <Button onClick={refetchPatients}>Tentar novamente</Button>
    </Alert>
  ) : null}

  <DataTableCard
    ariaLabel="Tabela de pacientes"
    footer={
      <PatientPagination
        page={patientPage.page}
        totalPages={patientPage.totalPages}
        onPageChange={setPageIndex}
      />
    }
  >
    <PatientTable
      patients={patientPage.content}
      selectedId={selectedId}
      isLoading={isLoading}
      isFetching={isFetching}
      onSelect={selectPatient}
    />
  </DataTableCard>

  <PatientDetailModal
    open={detailOpen}
    patient={selectedPatient}
    onOpenChange={handleDetailOpenChange}
  />

  <span className="sr-only" aria-live="polite">
    {isFetching ? 'Atualizando lista de pacientes.' : ''}
  </span>
</PageContainer>
~~~

---

## 13. Modal de detalhe do paciente

Arquivo: `src/features/patients/components/patient-detail-modal.tsx`.

### 13.1. Interface

~~~tsx
type PatientDetailModalProps = {
  open: boolean
  patient: PatientListItem | null
  onOpenChange(open: boolean): void
}
~~~

### 13.2. Estrutura

~~~tsx
export function PatientDetailModal({
  open,
  patient,
  onOpenChange,
}: PatientDetailModalProps) {
  if (!patient) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby="patient-detail-description"
        className="max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>Detalhes do paciente</DialogTitle>
          <DialogDescription id="patient-detail-description">
            Informações cadastrais do paciente selecionado.
          </DialogDescription>
        </DialogHeader>

        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Código" value={patient.code} />
          <DetailItem label="Status" value={patient.status} />
          <DetailItem
            label="Data de cadastro"
            value={formatDate(patient.createdAt)}
          />
          <DetailItem
            label="Serviço principal"
            value={patient.primaryService ?? '—'}
          />
          <DetailItem
            label="Unidades vinculadas"
            value={patient.unitsCount?.toString() ?? '—'}
          />
        </dl>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
~~~

### 13.3. Conteúdo apresentado

O modal mostra:

- código do paciente;
- status;
- data de cadastro formatada em `pt-BR`;
- serviço principal;
- quantidade de unidades vinculadas.

Quando uma propriedade opcional não está disponível, o valor exibido é `—`.

### 13.4. Fonte de dados

O modal recebe o paciente selecionado pela página:

~~~tsx
patient={selectedPatient}
~~~

Não há nova chamada HTTP no modal.

Essa decisão mantém o escopo alinhado à change e evita introduzir um contrato de detalhe ainda inexistente.

### 13.5. Fechamento

O modal possui:

- botão de fechamento do primitive de Dialog;
- botão explícito “Fechar”;
- callback `onOpenChange`;
- restauração de foco implementada pela página.

O componente de detalhe não conhece a tabela nem a paginação. Ele apenas recebe o paciente e comunica a mudança de abertura.

---

## 14. Separação entre detalhe e cadastro

### 14.1. Situação anterior

O modal existente se chamava `AddPatientModal` e concentrava o formulário de cadastro.

### 14.2. Renomeação sem quebra

O componente principal passou a se chamar `PatientFormModal`:

~~~tsx
export function PatientFormModal() {
  // formulário de cadastro existente
}
~~~

Para preservar compatibilidade com imports legados, foi mantido um alias:

~~~tsx
export const AddPatientModal = PatientFormModal
~~~

Também foi criado o wrapper:

Arquivo: `src/features/patients/components/patient-form-modal.tsx`.

~~~tsx
export { PatientFormModal } from './add-patient-modal'
~~~

### 14.3. Uso na página

A página importa o nome orientado à responsabilidade:

~~~tsx
import { PatientFormModal } from '../components/patient-form-modal'
~~~

E utiliza:

~~~tsx
<PageHeader
  ...
  actions={<PatientFormModal />}
/>
~~~

### 14.4. O que permaneceu igual

A lógica existente do cadastro foi preservada:

- `react-hook-form`;
- validação com Zod;
- seleção de unidade para perfil administrativo;
- `activeUnitId` para perfil básico;
- POST para `/patient/save`;
- mensagens de erro;
- toast de sucesso;
- invalidação da lista de pacientes;
- foco no primeiro campo.

A mudança foi estrutural e de nomenclatura, não uma alteração do contrato de cadastro.

---

## 15. Fluxo completo da interação

O fluxo mestre-detalhe ficou assim:

~~~text
Usuário acessa Pacientes
        |
        v
PageContainer organiza a página
        |
        v
PageHeader apresenta título e cadastro
        |
        v
PatientFilters altera filtros e reseta página
        |
        v
getPatientPage busca e normaliza a resposta
        |
        v
DataTableCard cria o enquadramento visual
        |
        v
PatientTable apresenta loading, vazio ou linhas
        |
        v
Usuário clica na linha/botão ou usa Enter/Space
        |
        v
patients-page registra selectedId e trigger
        |
        v
PatientDetailModal abre com o paciente atual
        |
        v
Usuário fecha o modal
        |
        v
foco retorna ao trigger original
~~~

### Paginação

Ao trocar de página:

1. a query recebe o novo índice;
2. `isFetching` indica atualização;
3. a tabela mantém a estrutura visual;
4. se o paciente selecionado não estiver mais na página, a seleção é limpa;
5. o modal é fechado caso ainda estivesse aberto.

### Filtros

Ao aplicar ou limpar filtros:

1. o estado de filtros é atualizado;
2. a página volta para índice zero;
3. a seleção é removida;
4. o modal é fechado;
5. a lista é requisitada novamente.

### Cadastro

Ao cadastrar:

1. `PatientFormModal` envia o formulário;
2. a mutation invalida `PatientCatalog/LIST`;
3. a query da listagem é atualizada;
4. a nova lista aparece na tabela;
5. nenhuma seleção anterior é mantida artificialmente.

---

## 16. Documentação dos módulos

### 16.1. README de componentes globais

Arquivo: `src/components/README.md`.

Foi documentado que:

- `PageContainer` é o shell de página;
- `PageHeader` é o shell de cabeçalho;
- `DataTableCard` é o shell visual para tabelas;
- shells não devem conter chamadas de API;
- shells não devem conter regras de tenancy;
- shells não devem conter regras de autorização;
- shells não devem implementar papel visual de domínio.

### 16.2. README de pacotes

Arquivo: `src/features/packages/README.md`.

Foi registrado que a feature utiliza os shells globais, mas mantém seus próprios componentes de domínio, como:

- tabela;
- formulário;
- paginação;
- ações específicas.

### 16.3. README de pacientes

Arquivo: `src/features/patients/README.md`.

Foi atualizada a estrutura para incluir:

~~~text
features/patients/
├── api/
├── components/
│   ├── add-patient-modal.tsx
│   ├── patient-detail-modal.tsx
│   ├── patient-form-modal.tsx
│   ├── patient-table-rows.tsx
│   └── patient-table.tsx
├── pages/
│   └── patients-page.tsx
└── ...
~~~

Também foi documentado que:

- o detalhe usa os dados já presentes na listagem;
- o cadastro permanece no formulário existente;
- edição e desativação continuam aguardando contratos específicos;
- os shells visuais são compartilhados com pacotes.

---

## 17. Testes adicionados e atualizados

### 17.1. Testes dos shells

Arquivo: `src/components/__tests__/page-shell.test.tsx`.

Coberturas:

- renderização de título;
- descrição;
- ícone;
- ação;
- semântica de `main`;
- ausência de ícone e ação quando não fornecidos.

### 17.2. Testes da API

Arquivo: `src/features/patients/api/patients.test.ts`.

Coberturas:

- preservação de resposta paginada;
- normalização de array legado;
- normalização de resposta vazia.

### 17.3. Testes de integração da página

Os testes existentes de pacientes foram mantidos e executados para garantir que:

- a listagem continua carregando;
- filtros continuam funcionando;
- paginação permanece conectada;
- o cadastro continua enviando os dados;
- a invalidação da lista não foi quebrada.

### 17.4. Testes executados

Comando direcionado:

~~~bash
npm run test -- \
  src/components/__tests__/page-shell.test.tsx \
  src/features/packages/pages/packages-page.test.tsx \
  src/features/patients/api/patients.test.ts \
  src/features/patients/__tests__/patients-page.integration.test.tsx \
  src/features/patients/__tests__/patient-create.integration.test.tsx \
  --run
~~~

Resultado:

~~~text
5 arquivos de teste aprovados
25 testes aprovados
~~~

---

## 18. Validações técnicas

### Lint

~~~bash
npm run lint -- --no-fix
~~~

Resultado: aprovado.

### Build

~~~bash
npm run build
~~~

Resultado: aprovado.

O Vite apresentou apenas o aviso já esperado de chunk acima de 500 kB. Esse aviso não impediu o build e não foi introduzida uma alteração de otimização de bundle nesta change.

### Validação OpenSpec

~~~bash
openspec validate refatorar-listagem-pacientes-mestre-detalhe --strict
~~~

Resultado: aprovado.

Todas as tarefas da change foram concluídas:

~~~text
total: 15
complete: 15
remaining: 0
state: all_done
~~~

---

## 19. Limitações e decisões fora do escopo

### Detalhe remoto

O modal não executa uma consulta específica por ID. Ele utiliza o objeto já carregado na página.

Motivo: a change não introduziu nem alterou um endpoint de detalhe de paciente.

### Edição

A ação de edição permanece sem implementação funcional porque não havia contrato de edição incluído no escopo.

### Desativação

A ação de desativação permanece sem implementação funcional porque não havia mutation nem contrato HTTP incluído no escopo.

### Dados adicionais

Campos que não existem no payload atual são apresentados com `—`. Isso evita inventar dados no frontend.

### Alterações de backend

Nenhum contrato backend foi alterado nesta implementação.

### Componentes globais

Os componentes globais são visuais e composicionais. Eles não devem receber responsabilidades de domínio no futuro.

---

## 20. Resumo final da implementação

A change entregou a refatoração da listagem de pacientes para o padrão mestre-detalhe utilizado em pacotes.

O estado final possui:

- `PageContainer` global;
- `PageHeader` global;
- `DataTableCard` global;
- `PatientTable` específico;
- `PatientTableRows` acessível;
- seleção por mouse, Enter e Space;
- `PatientDetailModal`;
- retorno de foco após fechar o modal;
- limpeza da seleção durante paginação e filtros;
- normalização de resposta paginada e array legado;
- preservação do fluxo de cadastro;
- documentação dos componentes e módulos;
- testes automatizados;
- lint aprovado;
- build aprovado;
- OpenSpec validado.

A principal decisão arquitetural foi separar o que é visual e reutilizável do que é específico de pacientes. Os shells globais padronizam a aparência, enquanto a feature continua responsável por seus dados, estados, regras e componentes de domínio.

