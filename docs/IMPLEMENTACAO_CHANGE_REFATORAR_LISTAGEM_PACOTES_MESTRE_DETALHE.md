# Implementação da Change `refatorar-listagem-pacotes-mestre-detalhe`

## 1. Objetivo deste documento

Este documento registra, como um guia de implementação, a refatoração da
feature de pacotes de serviço nos dois lados da aplicação:

- frontend React/TypeScript, no projeto `agendamento-smart-web`;
- backend Java/Spring Boot/PostgreSQL, no projeto `agendamento-smart-api`.

A change reorganiza a tela administrativa de pacotes no padrão mestre-detalhe.
A tabela é o mestre, o painel contextual é o detalhe, e a criação/edição passa
a ocorrer em um modal. A listagem também passa a trabalhar com paginação
server-side, filtros aplicados no backend e metadados de navegação.

O objetivo aqui é explicar o que existia, o que foi alterado, como cada parte
se conecta, quais contratos foram preservados e como verificar a entrega.

## 2. Resultado final

O fluxo final ficou assim:

```text
Sessão autenticada
        │
        ▼
PackagesPage
  ├── consulta filtros + page + size
  ├── PackageTableFilter
  ├── PackageTable (mestre)
  ├── PackagePagination
  ├── PackageDetailPanel (detalhe)
  └── PackageFormModal (criação/edição)
        │
        ▼
GET /api/service-packages?page=0&size=10&...
        │
        ▼
PageResponseDTO<ServicePackageResponse>
```

Em telas largas, tabela e detalhe aparecem lado a lado. Em telas estreitas,
o detalhe é empilhado abaixo da tabela. O botão `Novo pacote` fica acima da
listagem e abre o modal de criação. A ação `Editar` abre o mesmo modal com os
dados preenchidos.

## 3. Escopo e limites

### Incluído

- container mais amplo para a tela de pacotes;
- filtros separados em componente reutilizável;
- substituição da apresentação principal em cards por tabela semântica;
- paginação controlada com primeira, anterior, próxima e última página;
- seleção de uma linha como mestre;
- painel contextual com os dados completos do pacote;
- modal único para criação e edição;
- preservação da validação existente do formulário;
- preservação das mutations de criar, editar e alterar situação;
- paginação real no backend;
- filtros no banco de dados;
- testes de contrato, UI, integração e segurança de tenant;
- documentação da feature e da API.

### Não incluído

- novos campos de domínio do pacote;
- exclusão física;
- alteração das regras de imutabilidade;
- alteração de permissões;
- mudança de rota;
- alteração do fluxo de contratação/agendamento por pacote;
- paginação de outros catálogos;
- migration de banco ou dependência nova.

## 4. Como era no frontend

Antes da change, `PackagesPage` concentrava praticamente toda a
responsabilidade da feature:

1. carregava sessão, unidades, serviços e pacotes;
2. mantinha os filtros aplicados e o rascunho de filtros;
3. renderizava os filtros diretamente na página;
4. renderizava cards/listas diretamente na página;
5. renderizava o formulário de criação e edição inline;
6. controlava validação, seleção de dias, submit e mensagens;
7. controlava detalhe, edição e situação no mesmo arquivo.

O adaptador de consulta também reduzia a resposta da API a um array:

```ts
function contentOf(value: unknown): ServicePackage[] {
  if (Array.isArray(value)) return value as ServicePackage[]
  return (value as { content?: ServicePackage[] }).content ?? []
}

getServicePackages: builder.query<
  ServicePackage[],
  ServicePackageFilters | void
>({
  query: (params) => ({
    url: '/api/service-packages',
    params,
  }),
  transformResponse: contentOf,
})
```

Esse modelo tinha duas limitações importantes:

- os metadados de paginação eram descartados;
- a página não tinha uma fonte de verdade para total de registros, total de
  páginas ou indicação de última página.

O formulário ficava sempre presente no fluxo principal. A mesma tela misturava
cadastro, filtros, consulta e leitura de detalhe, aumentando o acoplamento e
dificultando a comparação dos pacotes.

## 5. Como ficou o frontend

### 5.1 Tipos do contrato paginado

O primeiro passo foi alterar o tipo remoto da listagem para representar uma
página:

```ts
export interface ServicePackageListQuery extends ServicePackageFilters {
  page: number
  size: number
}

export interface ServicePackagePage {
  content: ServicePackage[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}
```

`ServicePackageFilters` continua representando os filtros de negócio:

```ts
export interface ServicePackageFilters {
  unitId?: string
  serviceId?: string
  active?: boolean
  totalSessions?: number
  name?: string
}
```

O tipo `ServicePackageListQuery` combina esses filtros com `page` e `size`.
Assim, a página não precisa conhecer a montagem manual de query strings.

### 5.2 Normalização da resposta

Durante a transição entre frontend e API, o adaptador aceita três formas:

1. resposta paginada completa;
2. envelope legado `{ content: [...] }`;
3. array direto.

O normalizador implementado foi:

```ts
interface PageFallback {
  page: number
  size: number
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function numberOr(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : fallback
}

export function normalizeServicePackagePage(
  value: unknown,
  fallback: PageFallback = { page: 0, size: 10 },
): ServicePackagePage {
  const record = asRecord(value)
  const content = Array.isArray(value)
    ? (value as ServicePackage[])
    : Array.isArray(record?.content)
      ? (record.content as ServicePackage[])
      : []

  const hasPaginationMetadata =
    record &&
    typeof record.page === 'number' &&
    typeof record.size === 'number' &&
    typeof record.totalElements === 'number' &&
    typeof record.totalPages === 'number' &&
    typeof record.last === 'boolean'

  if (hasPaginationMetadata) {
    return {
      content,
      page: numberOr(record.page, fallback.page),
      size: numberOr(record.size, fallback.size),
      totalElements: numberOr(record.totalElements, content.length),
      totalPages: numberOr(record.totalPages, content.length ? 1 : 0),
      last: Boolean(record.last),
    }
  }

  return {
    content,
    page: 0,
    size: fallback.size,
    totalElements: content.length,
    totalPages: content.length ? 1 : 0,
    last: true,
  }
}
```

O fallback legado é deliberadamente limitado a uma única página. O frontend
não fatiará uma coleção completa no navegador e não fabricará páginas que a
API não informou. Isso evita esconder uma integração incompleta e mantém a
compatibilidade dos mocks e ambientes intermediários.

### 5.3 Consulta RTK Query antes e depois

Antes, o endpoint enviava somente filtros e expunha `ServicePackage[]`:

```ts
getServicePackages: builder.query<
  ServicePackage[],
  ServicePackageFilters | void
>({
  query: (params) => ({ url: '/api/service-packages', params }),
  transformResponse: contentOf,
})
```

Depois, a consulta envia paginação e somente filtros preenchidos:

```ts
getServicePackages: builder.query<
  ServicePackagePage,
  ServicePackageListQuery | void
>({
  query: (params) => {
    const query = params ?? { page: 0, size: 10 }
    const { page, size, unitId, serviceId, active, totalSessions, name } = query

    return {
      url: '/api/service-packages',
      params: {
        page,
        size,
        ...(unitId ? { unitId } : {}),
        ...(serviceId ? { serviceId } : {}),
        ...(active === undefined ? {} : { active }),
        ...(totalSessions === undefined ? {} : { totalSessions }),
        ...(name ? { name } : {}),
      },
    }
  },
  transformResponse: (value, _meta, arg) =>
    normalizeServicePackagePage(value, {
      page: arg?.page ?? 0,
      size: arg?.size ?? 10,
    }),
  providesTags: ['ServicePackage'],
})
```

O uso de `active === undefined` é importante: `false` é um filtro válido e
não pode ser eliminado pela montagem da query. O mesmo cuidado vale para
`totalSessions === 0`, caso o contrato seja expandido no futuro.

### 5.4 Nova composição de `PackagesPage`

O estado que antes era misturado ao formulário foi reorganizado em estados
explícitos:

```tsx
const PAGE_SIZE = 10

const [filters, setFilters] = useState<ServicePackageFilters>({})
const [page, setPage] = useState(0)
const [selectedId, setSelectedId] = useState<string | null>(null)
const [editingId, setEditingId] = useState<string | null>(null)
const [modalOpen, setModalOpen] = useState(false)
const modalReturnFocus = useRef<HTMLElement | null>(null)

const packages = useGetServicePackagesQuery(
  { ...filters, page, size: PAGE_SIZE },
  { skip: sessionQuery.isLoading || !isAdmin },
)

const focusedId = editingId ?? selectedId
const detailQuery = useGetServicePackageQuery(focusedId ?? '', {
  skip: !focusedId,
})

const items = packages.data?.content ?? []
const selectedListItem = items.find((item) => item.id === selectedId) ?? null
const selectedItem = selectedId
  ? detailQuery.data ?? selectedListItem
  : null
```

O significado de cada estado é separado:

- `filters`: critérios efetivamente aplicados no backend;
- `page`: índice zero-based da página solicitada;
- `selectedId`: pacote selecionado na tabela mestre;
- `editingId`: pacote que está sendo editado no modal;
- `modalOpen`: estado visual do modal;
- `modalReturnFocus`: elemento que deve recuperar foco depois do fechamento.

Ao aplicar ou limpar filtros, a página e a seleção são reiniciadas:

```tsx
function applyFilters(nextFilters: ServicePackageFilters) {
  setFilters(nextFilters)
  setPage(0)
  setSelectedId(null)
}

function clearFilters() {
  setFilters({})
  setPage(0)
  setSelectedId(null)
}
```

Se a página atual deixar de conter o item selecionado, a seleção é removida:

```tsx
useEffect(() => {
  if (
    selectedId &&
    packages.data &&
    !items.some((item) => item.id === selectedId)
  ) {
    setSelectedId(null)
  }
}, [items, packages.data, selectedId])
```

Essa regra evita que o detalhe de um pacote de uma página anterior continue
visível depois de uma troca de página ou filtro.

### 5.5 Layout final

O container anterior usava `max-w-6xl` e colocava o formulário inline. O novo
container usa largura maior e separa a área de cabeçalho, filtros, mestre,
detalhe e modal:

```tsx
<main className="min-h-full bg-slate-50/70 px-4 pt-20 pb-8 sm:px-6 lg:px-8">
  <section className="mx-auto w-full max-w-[1600px] space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#20382d]">
          Pacotes de serviços
        </h1>
        <p className="text-sm text-muted-foreground">
          Consulte, compare e configure sessões, dias e valores por unidade.
        </p>
      </div>
      <Button type="button" onClick={openCreateModal}>
        Novo pacote
      </Button>
    </header>

    <PackageTableFilter ... />

    <div
      className={
        selectedItem
          ? 'grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]'
          : undefined
      }
    >
      <section
        aria-label="Lista de pacotes"
        className="overflow-hidden rounded-xl border bg-white shadow-sm"
      >
        <PackageTable ... />
        <PackagePagination ... />
      </section>

      {selectedItem ? <PackageDetailPanel ... /> : null}
    </div>

    <PackageFormModal ... />
  </section>
</main>
```

O grid só cria a segunda coluna quando existe seleção. Sem seleção, a tabela
ocupa toda a largura. O breakpoint `xl` garante a composição lado a lado em
viewport ampla; abaixo dele o fluxo normal empilha tabela e detalhe.

## 6. Componentes reutilizáveis do frontend

### 6.1 `PackageTableFilter`

Arquivo: `src/features/packages/components/package-table-filter.tsx`.

Responsabilidades:

- manter um `draft` local enquanto a pessoa digita;
- não disparar consulta a cada tecla;
- aplicar todos os campos ao clicar em `Filtrar`;
- remover valores vazios;
- limpar draft e filtros aplicados;
- desabilitar controles durante atualização;
- usar catálogos de unidades e serviços carregados pela página.

Trecho central:

```tsx
const [draft, setDraft] = useState<ServicePackageFilters>(value)

useEffect(() => {
  setDraft(value)
}, [value])

function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  onApply({
    ...draft,
    name: draft.name?.trim() || undefined,
  })
}

function handleClear() {
  setDraft({})
  onClear()
}
```

Os cinco filtros mantidos são:

| Campo | Controle | Valor enviado |
|---|---|---|
| Nome | `Input` | texto aparado |
| Unidade | `select` | `unitId` |
| Serviço | `select` | `serviceId` |
| Situação | `select` | `true`, `false` ou ausente |
| Sessões | `Input type=number` | `totalSessions` numérico |

### 6.2 `PackageTable`

Arquivo: `src/features/packages/components/package-table.tsx`.

A tabela é o mestre. Ela recebe dados e callbacks, mas não conhece RTK Query,
rotas ou regras de autorização. Isso permite reutilizar a apresentação em
outro contexto da feature.

Colunas implementadas:

1. pacote;
2. serviço;
3. unidade;
4. sessões;
5. frequência;
6. valor;
7. situação;
8. ações.

O cabeçalho usa os primitives semânticos `TableHeader`, `TableRow`,
`TableHead`, `TableBody` e `TableCell`.

```tsx
<TableHeader className="bg-emerald-700 text-white">
  <TableRow className="hover:bg-emerald-700">
    <TableHead className="min-w-[220px] text-white">Pacote</TableHead>
    <TableHead className="min-w-[170px] text-white">Serviço</TableHead>
    <TableHead className="min-w-[150px] text-white">Unidade</TableHead>
    <TableHead className="text-white">Sessões</TableHead>
    <TableHead className="text-white">Frequência</TableHead>
    <TableHead className="text-white">Valor</TableHead>
    <TableHead className="text-white">Situação</TableHead>
    <TableHead className="min-w-[190px] text-white">Ações</TableHead>
  </TableRow>
</TableHeader>
```

Cada linha:

- tem `tabIndex={0}`;
- informa `aria-selected`;
- usa `data-state="selected"` para o estilo de seleção;
- pode ser selecionada por clique;
- pode ser selecionada por `Enter` ou espaço;
- interrompe propagação nas ações internas para não selecionar novamente a
  linha ao clicar em `Editar`, `Detalhes` ou `Ativar/Desativar`.

O estado vazio não renderiza cards alternativos:

```tsx
{!isLoading && items.length === 0 ? (
  <TableRow>
    <TableCell colSpan={8} className="h-40 text-center">
      <p className="font-semibold">Nenhum pacote encontrado</p>
      <p className="text-muted-foreground text-sm">
        Ajuste os filtros ou cadastre um novo pacote.
      </p>
    </TableCell>
  </TableRow>
) : null}
```

Durante carregamento inicial, cinco linhas de skeleton evitam que a tabela
pareça vazia. Durante uma atualização de página, uma mensagem `sr-only` com
`role="status"` anuncia a atualização sem alterar o layout.

### 6.3 `PackagePagination`

Arquivo: `src/features/packages/components/package-pagination.tsx`.

O componente não calcula o total consultando a lista. Ele recebe os metadados
da API:

```tsx
<PackagePagination
  page={packages.data?.page ?? page}
  totalPages={packages.data?.totalPages ?? 0}
  totalElements={packages.data?.totalElements ?? 0}
  last={packages.data?.last ?? true}
  disabled={packages.isFetching}
  onPageChange={(nextPage) => setPage(Math.max(nextPage, 0))}
/>
```

Os limites são normalizados para que uma resposta vazia ainda mostre uma
paginação consistente:

```tsx
const normalizedTotalPages = Math.max(totalPages, 1)
const isFirst = page <= 0
const isLast = last || page >= normalizedTotalPages - 1
```

São fornecidos controles para:

- primeira página;
- página anterior;
- próxima página;
- última página.

Os controles são desabilitados quando a navegação não se aplica ou quando a
consulta está em andamento.

### 6.4 `PackageDetailPanel`

Arquivo: `src/features/packages/components/package-detail-panel.tsx`.

O painel é o detalhe contextual do mestre. Ele usa `aside` com nome acessível
e contém:

- serviço;
- unidade;
- total de sessões;
- frequência semanal;
- valor total;
- situação;
- descrição, quando existir;
- dias da semana traduzidos;
- editar pacote;
- ativar/desativar;
- fechar detalhe.

O detalhe usa primeiro o item da linha para resposta imediata e, quando
disponível, substitui os dados pelo retorno de `GET /api/service-packages/{id}`.
Assim a seleção não fica bloqueada aguardando a segunda consulta.

```tsx
{!isLoading && !isError && item ? (
  <div className="mt-6 space-y-5">
    <dl className="grid gap-4 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-muted-foreground">Serviço</dt>
        <dd className="font-medium">{item.serviceName}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Unidade</dt>
        <dd className="font-medium">{item.unitName}</dd>
      </div>
      {/* demais campos do detalhe */}
    </dl>
  </div>
) : null}
```

Há estados separados para carregamento e erro. O botão de fechar apenas limpa
`selectedId`; filtros e página permanecem intactos.

### 6.5 `PackageFormModal`

Arquivo: `src/features/packages/components/package-form-modal.tsx`.

O formulário que antes era inline foi isolado em um único modal. Ele recebe:

- `open` e `onOpenChange`;
- `isEditing`;
- `initialValues`;
- unidades e serviços;
- estados de carregamento de catálogos, detalhe e mutation;
- callback `onSubmit`.

O formulário continua usando o mesmo schema:

```tsx
const parsed = packageFormSchema.safeParse(form)

if (!parsed.success) {
  const errors = parsed.error.flatten().fieldErrors
  setFieldErrors(
    Object.fromEntries(
      Object.entries(errors).map(([field, messages]) => [
        field,
        messages?.[0] ?? 'Revise este campo.',
      ]),
    ),
  )
  return
}

setFieldErrors({})
onSubmit(parsed.data)
```

O modal usa o primitive `Dialog` existente, portanto o foco é contido enquanto
ele está aberto e retorna ao botão que abriu a operação:

```tsx
function openCreateModal(event: MouseEvent<HTMLButtonElement>) {
  modalReturnFocus.current = event.currentTarget
  setEditingId(null)
  setModalOpen(true)
}

function handleModalOpenChange(open: boolean) {
  setModalOpen(open)
  if (!open) {
    setEditingId(null)
    requestAnimationFrame(() => modalReturnFocus.current?.focus())
  }
}
```

A criação inicia com `emptyPackageForm()`; a edição usa `formFromPackage`:

```tsx
function formFromPackage(item: ServicePackage): PackageFormValues {
  return {
    name: item.name,
    description: item.description ?? '',
    unitId: item.unitId,
    serviceId: item.serviceId,
    totalSessions: String(item.totalSessions),
    totalPrice: item.totalPrice,
    weekDays: item.weekDays,
  }
}
```

Fechar ou cancelar não altera filtros, página ou seleção. Salvar chama as
mutations existentes e fecha o modal somente após sucesso.

## 7. Fluxo de criação, edição e situação

### Criação

1. A pessoa autorizada clica em `Novo pacote`.
2. `PackagesPage` salva o botão como origem do foco.
3. `editingId` fica nulo.
4. `PackageFormModal` abre com formulário vazio.
5. O schema valida campos obrigatórios, preço e dias.
6. `toServicePackageInput` converte os valores para o payload da API.
7. `createServicePackage` executa `POST /api/service-packages`.
8. A tag `ServicePackage` é invalidada.
9. O modal fecha e a lista é recarregada preservando os filtros atuais.

### Edição

1. A pessoa seleciona uma linha ou clica em `Editar`.
2. `selectedId` identifica o mestre e `editingId` identifica a edição.
3. A consulta de detalhe carrega os dados completos.
4. `formFromPackage` preenche o mesmo formulário.
5. O modal identifica a operação como `Editar pacote`.
6. O submit chama `PATCH /api/service-packages/{id}`.
7. A tag da lista e a tag do item são invalidadas.
8. O modal fecha após sucesso.

### Alteração de situação

1. A pessoa clica em `Desativar` ou `Ativar`.
2. A página envia somente `{ active: boolean }`.
3. A API valida imutabilidade e permissões.
4. A tag é invalidada.
5. A mesma linha permanece na tabela com o novo badge.

## 8. Ajuste do consumidor de agendamento por pacote

O endpoint de listagem passou a devolver uma página. O diálogo de agendamento
precisou parar de tratar o resultado como array:

Antes:

```tsx
const packagesQuery = useGetServicePackagesQuery({
  active: true,
  unitId: effectiveUnitId || undefined,
})

const selectedPackage = packagesQuery.data?.find(
  (item) => item.id === packageId,
)
```

Depois:

```tsx
const packagesQuery = useGetServicePackagesQuery({
  active: true,
  unitId: effectiveUnitId || undefined,
  page: 0,
  size: 100,
})

const packageItems = packagesQuery.data?.content ?? []
const selectedPackage = packageItems.find(
  (item) => item.id === packageId,
)
```

O tamanho 100 é intencional: o diálogo precisa consultar uma coleção ampla de
pacotes ativos da unidade para manter a seleção, mas respeita o limite máximo
definido pela API. A consulta continua condicionada à unidade efetiva, evitando
carregar pacotes antes de conhecer o escopo.

## 9. Como era no backend

Antes da change específica da API, o controller devolvia um `CatalogResponse`
com uma lista:

```java
@GetMapping
public CatalogResponse<ServicePackageResponse> findAll(
        @AuthenticationPrincipal User user,
        @RequestParam(required = false) UUID unitId,
        @RequestParam(required = false) UUID serviceId,
        @RequestParam(required = false) Boolean active,
        @RequestParam(required = false) Integer totalSessions,
        @RequestParam(required = false) String name) {
    return new CatalogResponse<>(
            service.findAll(user, unitId, serviceId, active, totalSessions, name));
}
```

O serviço carregava todos os pacotes da clínica e filtrava em memória:

```java
List<ServicePackageDefinition> packages =
        packageRepository.findAllByClinicIdOrderByNameAsc(
                user.getClinic().getId());

Stream<ServicePackageDefinition> filtered = packages.stream();
if (unitId != null) filtered = filtered.filter(...);
if (serviceId != null) filtered = filtered.filter(...);
if (active != null) filtered = filtered.filter(...);
if (totalSessions != null) filtered = filtered.filter(...);
if (name != null && !name.isBlank()) filtered = filtered.filter(...);

return filtered.map(this::toResponse).toList();
```

Esse fluxo obrigava o backend a trazer toda a coleção para a aplicação antes
de aplicar critérios e não conseguia informar metadados corretos de página.

## 10. Como ficou o backend

A implementação backend foi registrada na change OpenSpec irmã
`paginar-listagem-pacotes`, porque ela altera o contrato HTTP da listagem.

### 10.1 Reuso de `PageResponseDTO`

O projeto já possuía o DTO genérico:

```java
public record PageResponseDTO<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last
) {
    public static <T> PageResponseDTO<T> from(Page<T> page) {
        return new PageResponseDTO<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }
}
```

Esse DTO foi reutilizado para não criar um envelope específico apenas para
pacotes e para manter o padrão já utilizado por outros catálogos.

### 10.2 Controller antes e depois

O controller agora recebe `page` e `size` com defaults compatíveis:

```java
@GetMapping
public PageResponseDTO<ServicePackageResponse> findAll(
        @AuthenticationPrincipal User user,
        @RequestParam(required = false) UUID unitId,
        @RequestParam(required = false) UUID serviceId,
        @RequestParam(required = false) Boolean active,
        @RequestParam(required = false) Integer totalSessions,
        @RequestParam(required = false) String name,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
    return service.findAll(
            user, unitId, serviceId, active, totalSessions, name, page, size);
}
```

O índice é zero-based. Uma chamada sem parâmetros de paginação equivale a
`page=0&size=10`, preservando a possibilidade de clientes antigos chamarem o
endpoint sem enviar os novos parâmetros.

### 10.3 Serviço antes e depois

O serviço passou a validar a paginação antes de consultar o repositório e a
preservar as regras de escopo antes de montar a query:

```java
@Transactional(readOnly = true)
public PageResponseDTO<ServicePackageResponse> findAll(
        User user,
        UUID unitId,
        UUID serviceId,
        Boolean active,
        Integer totalSessions,
        String name,
        int page,
        int size) {
    validatePagination(page, size);

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

    String normalizedName = name == null || name.isBlank()
            ? null
            : name.trim();

    Page<ServicePackageDefinition> packages =
            packageRepository.findPageByClinicIdAndFilters(
                    user.getClinic().getId(),
                    unitId,
                    serviceId,
                    active,
                    totalSessions,
                    normalizedName,
                    PageRequest.of(
                            page,
                            size,
                            Sort.by(Sort.Direction.ASC, "name")));

    return PageResponseDTO.from(packages.map(this::toResponse));
}

private void validatePagination(int page, int size) {
    if (page < 0 || size < 1 || size > 100) {
        throw new DomainException(
                "PACKAGE_PAGINATION_ERROR",
                "Os parâmetros page e size são inválidos.",
                HttpStatus.BAD_REQUEST);
    }
}
```

O comportamento de acesso permanece:

- ADMIN consulta somente a clínica do principal autenticado;
- ADMIN pode filtrar por unidade, mas a unidade é validada na própria clínica;
- BASIC tem a unidade única autorizada forçada pelo serviço;
- BASIC sempre recebe `active=true`;
- BASIC tentando consultar unidade externa recebe
  `TENANT_RESOURCE_NOT_FOUND` com HTTP 404;
- validação de paginação acontece antes da consulta ao repositório.

### 10.4 Repositório antes e depois

Antes, o repositório expunha uma busca de lista ordenada:

```java
List<ServicePackageDefinition> findAllByClinicIdOrderByNameAsc(
        UUID clinicId);
```

Depois, a consulta retorna `Page` e aplica os filtros no banco:

```java
@Query("""
        select item from ServicePackageDefinition item
        where item.clinic.id = :clinicId
          and (:unitId is null or item.unit.id = :unitId)
          and (:serviceId is null or item.service.id = :serviceId)
          and (:active is null or item.active = :active)
          and (:totalSessions is null or item.totalSessions = :totalSessions)
          and (coalesce(:name, '') = '' or
               lower(item.name) like lower(concat('%', coalesce(:name, ''), '%')))
        """)
Page<ServicePackageDefinition> findPageByClinicIdAndFilters(
        @Param("clinicId") UUID clinicId,
        @Param("unitId") UUID unitId,
        @Param("serviceId") UUID serviceId,
        @Param("active") Boolean active,
        @Param("totalSessions") Integer totalSessions,
        @Param("name") String name,
        Pageable pageable);
```

O `PageRequest` recebe a ordenação por `name` ascendente. A condição com
`coalesce(:name, '')` é necessária porque, no PostgreSQL, o parâmetro textual
nulo usado diretamente em `lower()` pode ser inferido como `bytea` durante a
query de contagem da página. A expressão mantém o filtro opcional e força a
tipagem textual.

O resultado é calculado pelo banco:

- `content`: registros da página atual;
- `page`: índice solicitado;
- `size`: tamanho efetivo;
- `totalElements`: total depois dos filtros;
- `totalPages`: quantidade total de páginas;
- `last`: indica se a página atual é a última.

## 11. Contrato HTTP final

### Endpoint

```text
GET /api/service-packages
```

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Regra |
|---|---|---:|---|
| `page` | inteiro | não | zero-based, padrão `0`, mínimo `0` |
| `size` | inteiro | não | padrão `10`, mínimo `1`, máximo `100` |
| `unitId` | UUID | não | filtra unidade |
| `serviceId` | UUID | não | filtra serviço |
| `active` | boolean | não | filtra situação |
| `totalSessions` | inteiro | não | filtra sessões |
| `name` | texto | não | busca parcial sem diferenciar maiúsculas/minúsculas |

### Exemplo de requisição

```http
GET /api/service-packages?page=0&size=10&active=true&name=fisio
Authorization: Bearer <token>
```

### Exemplo de resposta

```json
{
  "content": [
    {
      "id": "package-1",
      "unitId": "unit-1",
      "unitName": "Matriz",
      "serviceId": "service-1",
      "serviceName": "Fisioterapia",
      "name": "Fisioterapia 10 sessões",
      "description": "Recuperação funcional",
      "totalSessions": 10,
      "totalPrice": "400.00",
      "weekDays": ["MONDAY", "WEDNESDAY"],
      "weeklyFrequency": 2,
      "active": true
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1,
  "last": true
}
```

### Erro de paginação

Para `page < 0`, `size < 1` ou `size > 100`:

```json
{
  "code": "PACKAGE_PAGINATION_ERROR",
  "message": "Os parâmetros page e size são inválidos.",
  "fieldErrors": {}
}
```

O status HTTP é `400`.

## 12. Compatibilidade com o fluxo de contratação

O fluxo administrativo de contratação não foi alterado. A única adaptação foi
no consumidor da listagem, que passou a acessar `data.content` e solicitar a
primeira página com tamanho 100.

As regras de contratação continuam sob a API:

- unidade efetiva;
- paciente;
- pacote ativo;
- dias;
- fingerprint;
- idempotência;
- criação das sessões.

O frontend não se torna autoridade para autorização, tenant, imutabilidade ou
regras de negócio.

## 13. Testes adicionados e atualizados

### Frontend

O adaptador ganhou testes para:

- preservar todos os metadados de uma resposta paginada;
- converter `{ content }` legado em uma única página;
- aceitar array legado;
- tratar coleção vazia.

Os testes da página cobrem:

- renderização em tabela e ausência de cards;
- consulta da primeira e segunda página;
- envio de `page`, `size` e `name`;
- reinício para página zero ao aplicar filtro;
- abertura do modal de criação;
- foco dentro do modal;
- retorno de foco ao botão após cancelar;
- validação local do formulário;
- seleção de linha e painel de detalhe;
- carregamento de descrição e dias;
- edição no mesmo modal;
- fechamento do detalhe;
- ativação/desativação sem remover a linha;
- bloqueio da gestão para usuário sem papel administrativo.

Exemplo de asserção de paginação:

```tsx
await user.click(screen.getByRole('button', { name: 'Próxima página' }))

expect(await screen.findByText('Pilates 20 sessões')).toBeVisible()
expect(queries[queries.length - 1]?.get('page')).toBe('1')
expect(queries[queries.length - 1]?.get('size')).toBe('10')
```

### Backend

Os testes unitários do serviço cobrem:

- página negativa;
- tamanho acima do limite;
- ausência de consulta ao repositório quando a paginação é inválida;
- unidade autorizada forçada para BASIC;
- `active=true` forçado para BASIC;
- rejeição de unidade externa.

Os testes de integração cobrem:

- primeira página;
- última página;
- ordenação por nome;
- filtros combinados;
- resposta vazia;
- `totalElements`, `totalPages` e `last`;
- `400` para parâmetros inválidos;
- `404 TENANT_RESOURCE_NOT_FOUND` para unidade externa;
- preservação das mutations de criação, edição e situação;
- isolamento de clínica no detalhe.

## 14. Passo a passo para reproduzir a implementação

### Etapa 1 — entender o contrato existente

1. Ler `src/features/packages/README.md` no frontend.
2. Ler o `ServicePackageController`, `ServicePackageService` e
   `ServicePackageRepository` no backend.
3. Confirmar que a resposta antiga era `CatalogResponse`/`{ content }`.
4. Confirmar que as mutations de criação, edição e situação deveriam ser
   preservadas.
5. Confirmar que a API usa clínica do usuário autenticado.

### Etapa 2 — preparar o contrato de página

1. Definir `ServicePackageListQuery` no frontend.
2. Definir `ServicePackagePage` no frontend.
3. Reutilizar `PageResponseDTO` no backend.
4. Alterar o endpoint para aceitar `page` e `size`.
5. Definir defaults `0` e `10`.
6. Definir limite máximo de `100`.
7. Escrever testes para metadados e parâmetros.

### Etapa 3 — mover filtro e paginação para o backend

1. Trocar o método de lista do repositório por uma query `Page`.
2. Manter todos os filtros antigos.
3. Ordenar por nome ascendente com `PageRequest`.
4. Normalizar o nome antes da consulta.
5. Validar escopo ADMIN/BASIC antes da consulta.
6. Mapear a página de entidade para `PageResponseDTO`.
7. Verificar a query de contagem no PostgreSQL.

### Etapa 4 — extrair componentes do frontend

1. Criar `PackageTableFilter`.
2. Criar `PackageTable`.
3. Criar `PackagePagination`.
4. Criar `PackageDetailPanel`.
5. Criar `PackageFormModal`.
6. Remover filtros e formulário inline de `PackagesPage`.
7. Manter em `PackagesPage` somente orquestração e estado da rota.

### Etapa 5 — implementar o mestre-detalhe

1. Usar `selectedId` como única seleção.
2. Destacar a linha selecionada.
3. Consultar o detalhe pelo endpoint existente.
4. Usar o item da tabela enquanto o detalhe carrega.
5. Mostrar o painel lateral em `xl`.
6. Empilhar o painel em viewport estreita.
7. Limpar seleção ao trocar para uma página que não contém o item.

### Etapa 6 — transformar o formulário em modal

1. Extrair os campos existentes sem alterar o schema.
2. Adicionar modo criação/edição.
3. Preencher edição com o detalhe selecionado.
4. Salvar o elemento que abriu o modal.
5. Restaurar foco após fechar.
6. Manter mensagens de sucesso e erro.
7. Fechar somente depois de mutation bem-sucedida.

### Etapa 7 — ajustar consumidores

1. Procurar consumidores de `useGetServicePackagesQuery`.
2. Atualizar o diálogo de agendamento para usar `.content`.
3. Enviar `page=0` e `size=100` nesse fluxo.
4. Confirmar que nenhuma mutation teve seu payload alterado.

### Etapa 8 — verificar e documentar

1. Rodar testes do adaptador e da página.
2. Rodar testes unitários e integração do backend.
3. Rodar lint e build do frontend.
4. Rodar `./mvnw verify` no backend.
5. Rodar validação estrita das changes OpenSpec.
6. Atualizar README da feature e da API.

## 15. Arquivos envolvidos

### Frontend

- `src/features/packages/api/packages.ts`
- `src/features/packages/api/packages.test.ts`
- `src/features/packages/pages/packages-page.tsx`
- `src/features/packages/pages/packages-page.test.tsx`
- `src/features/packages/components/package-table-filter.tsx`
- `src/features/packages/components/package-table.tsx`
- `src/features/packages/components/package-pagination.tsx`
- `src/features/packages/components/package-detail-panel.tsx`
- `src/features/packages/components/package-form-modal.tsx`
- `src/features/packages/components/package-appointment-dialog.tsx`
- `src/features/packages/README.md`
- `openspec/changes/refatorar-listagem-pacotes-mestre-detalhe/`

### Backend

- `src/main/java/com/agendamento/smart/controller/servicepackage/ServicePackageController.java`
- `src/main/java/com/agendamento/smart/service/ServicePackageService.java`
- `src/main/java/com/agendamento/smart/repository/ServicePackageRepository.java`
- `src/main/java/com/agendamento/smart/dtos/PageResponseDTO.java`
- `src/main/java/com/agendamento/smart/controller/servicepackage/README.md`
- `src/test/java/com/agendamento/smart/service/ServicePackageServiceTest.java`
- `src/test/java/com/agendamento/smart/controller/servicepackage/ServicePackageControllerIntegrationTest.java`
- `openspec/changes/paginar-listagem-pacotes/`

## 16. Verificações realizadas

### Frontend

Na aplicação da change foram registrados:

- testes Vitest: 25 arquivos e 172 testes aprovados;
- `npm run lint` aprovado;
- `npm run build` aprovado;
- `openspec validate refatorar-listagem-pacotes-mestre-detalhe --strict`
  aprovado.

### Backend

Foram executados:

```bash
./mvnw -Dtest=ServicePackageServiceTest,ServicePackageControllerIntegrationTest test
./mvnw verify
openspec validate paginar-listagem-pacotes --strict
```

Resultado:

- testes focados: 8 aprovados;
- suíte completa: 71 testes aprovados;
- build e empacotamento Spring Boot: aprovados;
- validação OpenSpec estrita: aprovada.

## 17. Rollback seguro

O rollback pode ser feito sem migration de banco:

1. restaurar `PackagesPage` e o adaptador legado do frontend;
2. restaurar o controller para `CatalogResponse`;
3. restaurar o serviço para a consulta de lista;
4. restaurar o método de repositório com lista;
5. manter os endpoints de criação, detalhe, edição e situação inalterados.

Não há dados persistidos exclusivos da change, portanto não é necessário
rollback de schema.

## 18. Estado final e próximos cuidados

O frontend está preparado para o envelope paginado real e ainda tolera a forma
legada em mocks ou ambientes intermediários. A API irmã já entrega a forma
real, portanto a paginação da tela pode ser usada sem fatiamento no cliente.

O fallback legado pode ser removido em uma change futura somente depois de
confirmar que todos os ambientes consomem a API paginada. As regras de
autorização, tenant, imutabilidade e domínio devem continuar no backend.

Esta documentação descreve a implementação entregue; a fonte de verdade do
código continua sendo os arquivos listados na seção 15 e as especificações
OpenSpec correspondentes.
