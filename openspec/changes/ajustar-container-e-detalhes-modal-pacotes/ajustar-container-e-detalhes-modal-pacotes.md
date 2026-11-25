# Guia de implementação — `ajustar-container-e-detalhes-modal-pacotes`

## 1. Objetivo

Este documento registra a implementação real da change no frontend React/TypeScript
do Agendamentos Smart.

A change teve quatro objetivos principais:

1. ampliar o container da listagem de pacotes em telas largas;
2. trocar o detalhe contextual lateral por um modal acessível;
3. preservar filtros, paginação, seleção, criação, edição e situação;
4. validar os novos comportamentos com testes, lint, build e OpenSpec.

As imagens `AUMENTE-CONTAINER-LIST-PACOTE.jpg` e
`DETALHES-PACOTE-CONVERTER-EM-MODAL.jpg` foram referências visuais. Não houve
alteração de endpoint, payload, rota, permissão de servidor ou modelo de dados.

## 2. Resultado final

Ao final da implementação:

- o container passou de `max-w-[1600px]` para `max-w-[2048px]`;
- o `main` recebeu `overflow-x-hidden`;
- a tabela manteve o overflow horizontal restrito ao próprio contêiner;
- o grid mestre-detalhe foi removido;
- `PackageDetailPanel` passou a renderizar `Dialog`;
- o detalhe pode ser aberto pelo botão `Detalhes`, pelo clique na linha ou por
  `Enter`/`Space` na linha focada;
- o modal exibe dados, ações, carregamento e erro;
- o foco entra no modal e retorna para a origem ao fechar;
- editar continua usando `PackageFormModal`;
- os contratos HTTP foram preservados.

## 3. Arquivos alterados

### Código

- [`src/features/packages/pages/packages-page.tsx`](../../../src/features/packages/pages/packages-page.tsx)
  - container, estado de detalhe, foco e composição da página;
- [`src/features/packages/components/package-detail-panel.tsx`](../../../src/features/packages/components/package-detail-panel.tsx)
  - conversão de painel para diálogo modal;
- [`src/features/packages/components/package-table.tsx`](../../../src/features/packages/components/package-table.tsx)
  - propagação da origem da seleção;
- [`src/features/packages/pages/packages-page.test.tsx`](../../../src/features/packages/pages/packages-page.test.tsx)
  - testes de listagem, detalhe, teclado, foco, carregamento e erro;
- [`src/features/packages/README.md`](../../../src/features/packages/README.md)
  - documentação do comportamento atual.

### Artefatos da change

- [`proposal.md`](./proposal.md)
- [`specs/service-package-listing/spec.md`](./specs/service-package-listing/spec.md)
- [`design.md`](./design.md)
- [`tasks.md`](./tasks.md)

## 4. Como era a composição da página

Antes da change, a página tinha um limite de `1600px` e renderizava o detalhe
como uma coluna lateral no mesmo grid da tabela:

```tsx
<main className="min-h-full bg-slate-50/70 px-4 pt-20 pb-8 sm:px-6 lg:px-8">
  <section className="mx-auto w-full max-w-[1600px] space-y-6">
    {/* cabeçalho e filtros */}

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
        <PackageTable
          items={items}
          selectedId={selectedId}
          isLoading={packages.isLoading}
          isFetching={packages.isFetching}
          statusUpdating={changeStatusState.isLoading}
          onSelect={selectPackage}
          onEdit={openEditModal}
          onToggleStatus={(item) => void toggleStatus(item)}
        />
        <PackagePagination
          page={packages.data?.page ?? page}
          totalPages={packages.data?.totalPages ?? 0}
          totalElements={packages.data?.totalElements ?? 0}
          last={packages.data?.last ?? true}
          disabled={packages.isFetching}
          onPageChange={(nextPage) => setPage(Math.max(nextPage, 0))}
        />
      </section>

      {selectedItem ? (
        <PackageDetailPanel
          item={selectedItem}
          isLoading={detailQuery.isLoading}
          isError={detailQuery.isError}
          statusUpdating={changeStatusState.isLoading}
          onClose={() => setSelectedId(null)}
          onEdit={openEditModal}
          onToggleStatus={(item) => void toggleStatus(item)}
        />
      ) : null}
    </div>
  </section>
</main>
```

O painel anterior era um `<aside>`. Isso reduzia a largura da tabela quando um
pacote era selecionado e não fornecia a semântica de diálogo desejada.

## 5. Passo 1 — container responsivo

### Código anterior

```tsx
<main className="min-h-full bg-slate-50/70 px-4 pt-20 pb-8 sm:px-6 lg:px-8">
  <section className="mx-auto w-full max-w-[1600px] space-y-6">
```

### Código atual

```tsx
<main className="min-h-full overflow-x-hidden bg-slate-50/70 px-4 pt-20 pb-8 sm:px-6 lg:px-8">
  <section className="mx-auto w-full max-w-[2048px] space-y-6">
```

### Explicação

- `w-full` mantém o conteúdo ocupando a largura disponível;
- `max-w-[2048px]` aproveita melhor monitores grandes sem esticar
  indefinidamente o conteúdo;
- `mx-auto` centraliza o conteúdo quando a viewport excede o limite;
- `overflow-x-hidden` impede overflow horizontal do layout inteiro;
- a tabela continua com `overflow-x-auto` em seu contêiner, de modo que uma
  tabela muito larga não crie rolagem na página inteira;
- os paddings `px-4`, `sm:px-6` e `lg:px-8` foram preservados para manter
  margens adequadas em telas menores.

## 6. Passo 2 — separação entre seleção e abertura

### Estado anterior

```tsx
const [filters, setFilters] = useState<ServicePackageFilters>({})
const [page, setPage] = useState(0)
const [selectedId, setSelectedId] = useState<string | null>(null)
const [editingId, setEditingId] = useState<string | null>(null)
const [modalOpen, setModalOpen] = useState(false)
const modalReturnFocus = useRef<HTMLElement | null>(null)
```

O detalhe era consequência direta de `selectedId`:

```tsx
{selectedItem ? <PackageDetailPanel item={selectedItem} /> : null}
```

### Estado atual

```tsx
const [filters, setFilters] = useState<ServicePackageFilters>({})
const [page, setPage] = useState(0)
const [selectedId, setSelectedId] = useState<string | null>(null)
const [detailOpen, setDetailOpen] = useState(false)
const [editingId, setEditingId] = useState<string | null>(null)
const [modalOpen, setModalOpen] = useState(false)
const detailReturnFocus = useRef<HTMLElement | null>(null)
const modalReturnFocus = useRef<HTMLElement | null>(null)
```

`selectedId` representa qual pacote está selecionado. `detailOpen` representa
se o diálogo está visível. A separação permite fechar o modal mantendo o
contexto da listagem, sem limpar filtros, página ou seleção.

O identificador usado pela consulta completa continua sendo:

```tsx
const focusedId = editingId ?? selectedId

const detailQuery = useGetServicePackageQuery(focusedId ?? '', {
  skip: !focusedId,
})
```

Durante a edição, `editingId` tem prioridade para alimentar o formulário com os
dados completos do pacote.

## 7. Passo 3 — abertura e foco

### Código anterior

```tsx
function selectPackage(item: ServicePackage) {
  setSelectedId(item.id)
}

function openCreateModal(event: MouseEvent<HTMLButtonElement>) {
  modalReturnFocus.current = event.currentTarget
  setEditingId(null)
  setModalOpen(true)
}

function openEditModal(item: ServicePackage, trigger: HTMLElement) {
  modalReturnFocus.current = trigger
  setSelectedId(item.id)
  setEditingId(item.id)
  setModalOpen(true)
}
```

### Código atual

```tsx
function selectPackage(item: ServicePackage, trigger?: HTMLElement) {
  setSelectedId(item.id)
  detailReturnFocus.current =
    trigger ??
    (document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null)
  setDetailOpen(true)
}

function openCreateModal(event: MouseEvent<HTMLButtonElement>) {
  modalReturnFocus.current = event.currentTarget
  setDetailOpen(false)
  setEditingId(null)
  setModalOpen(true)
}

function openEditModal(item: ServicePackage, trigger: HTMLElement) {
  modalReturnFocus.current = detailOpen
    ? detailReturnFocus.current ?? trigger
    : trigger
  setDetailOpen(false)
  setSelectedId(item.id)
  setEditingId(item.id)
  setModalOpen(true)
}

function handleDetailOpenChange(open: boolean) {
  setDetailOpen(open)
  if (!open) {
    requestAnimationFrame(() => detailReturnFocus.current?.focus())
  }
}
```

### Por que existem duas referências de foco

`detailReturnFocus` pertence ao ciclo do modal de detalhe. `modalReturnFocus`
pertence ao ciclo de criação/edição. Separá-las evita que abrir o formulário a
partir do detalhe sobrescreva o foco original da tabela.

Quando o usuário edita dentro do detalhe, o detalhe é fechado antes do formulário
abrir. Isso evita dois diálogos concorrendo pelo foco. O formulário retorna para
a origem do detalhe quando essa origem ainda está disponível.

## 8. Passo 4 — tabela e origem da seleção

### Contrato anterior

```tsx
interface PackageTableProps {
  // ...
  onSelect: (item: ServicePackage) => void
  onEdit: (item: ServicePackage, trigger: HTMLElement) => void
}
```

### Contrato atual

```tsx
interface PackageTableProps {
  items: ServicePackage[]
  selectedId: string | null
  isLoading?: boolean
  isFetching?: boolean
  statusUpdating?: boolean
  onSelect: (item: ServicePackage, trigger?: HTMLElement) => void
  onEdit: (item: ServicePackage, trigger: HTMLElement) => void
  onToggleStatus: (item: ServicePackage) => void
}
```

### Teclado na linha

```tsx
function handleRowKeyDown(
  event: KeyboardEvent<HTMLTableRowElement>,
  item: ServicePackage,
) {
  if (event.target !== event.currentTarget) return
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onSelect(item, event.currentTarget)
  }
}
```

O `tabIndex={0}` da linha permite foco por teclado. `Enter` e `Space` abrem o
mesmo detalhe aberto pelo clique.

### Botão `Detalhes`

```tsx
<Button
  type="button"
  size="sm"
  variant="outline"
  onClick={(event) => {
    event.stopPropagation()
    onSelect(item, event.currentTarget)
  }}
>
  Detalhes
</Button>
```

`stopPropagation()` evita disparar também o clique da linha. O botão é enviado
como origem, permitindo que o foco volte exatamente para ele.

### Clique genérico da linha

```tsx
<TableRow
  key={item.id}
  tabIndex={0}
  aria-selected={selectedId === item.id}
  data-state={selectedId === item.id ? 'selected' : undefined}
  className="cursor-pointer"
  onClick={() => onSelect(item)}
  onKeyDown={(event) => handleRowKeyDown(event, item)}
>
```

O clique na linha continua abrindo o modal. Nesse caminho, o callback não recebe
um `trigger` explícito e `selectPackage` usa `document.activeElement` como
fallback. Na navegação por teclado, a linha é enviada explicitamente.

## 9. Passo 5 — conversão do detalhe para `Dialog`

### Estrutura anterior

```tsx
return (
  <aside
    aria-label="Detalhe do pacote"
    className="rounded-xl border bg-white p-5 shadow-sm"
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Detalhe
        </p>
        <h2 className="mt-1 text-xl font-semibold">
          {item?.name ?? 'Pacote selecionado'}
        </h2>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Fechar detalhe do pacote"
        onClick={onClose}
      >
        <X aria-hidden="true" />
      </Button>
    </div>

    {/* carregamento, erro, dados e ações */}
  </aside>
)
```

Props anteriores:

```tsx
interface PackageDetailPanelProps {
  item: ServicePackage | null
  isLoading?: boolean
  isError?: boolean
  statusUpdating?: boolean
  onClose: () => void
  onEdit: (item: ServicePackage, trigger: HTMLElement) => void
  onToggleStatus: (item: ServicePackage) => void
}
```

### Imports atuais

```tsx
import { X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
```

O primitive compartilhado já era usado por `PackageFormModal`. Reutilizá-lo
fornece portal, overlay, foco contido, `Escape` e semântica de diálogo sem
duplicar implementação.

### Props atuais

```tsx
interface PackageDetailPanelProps {
  open: boolean
  item: ServicePackage | null
  isLoading?: boolean
  isError?: boolean
  statusUpdating?: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (item: ServicePackage, trigger: HTMLElement) => void
  onToggleStatus: (item: ServicePackage) => void
}
```

### Estrutura atual

```tsx
return (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      showCloseButton={false}
      className="max-h-[90vh] overflow-y-auto sm:max-w-2xl xl:max-w-[560px]"
    >
      <DialogHeader className="pr-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <DialogDescription>Detalhe do pacote</DialogDescription>
            <DialogTitle className="mt-1">
              {item?.name ?? 'Pacote selecionado'}
            </DialogTitle>
          </div>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Fechar detalhe do pacote"
            >
              <X aria-hidden="true" />
            </Button>
          </DialogClose>
        </div>
      </DialogHeader>

      {/* carregamento, erro, dados e ações */}
    </DialogContent>
  </Dialog>
)
```

`showCloseButton={false}` desativa o botão automático do primitive para que o
componente use um botão explicitamente nomeado em português. O `DialogClose`
mantém a integração com `onOpenChange`.

### Responsividade do modal

```tsx
className="max-h-[90vh] overflow-y-auto sm:max-w-2xl xl:max-w-[560px]"
```

- `max-h-[90vh]` limita a altura;
- `overflow-y-auto` permite rolagem interna;
- `sm:max-w-2xl` aumenta a largura em telas maiores que o breakpoint `sm`;
- `xl:max-w-[560px]` mantém uma coluna lateral compacta em telas grandes;
- o `DialogContent` global mantém `w-full` e margem relativa à viewport em telas
  estreitas.

## 10. Dados, carregamento, erro e ações

### Carregamento

```tsx
{isLoading ? (
  <div className="mt-2 space-y-3" role="status">
    <span className="sr-only">Carregando detalhe do pacote...</span>
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-5 w-1/2" />
    <Skeleton className="h-20 w-full" />
  </div>
) : null}
```

O skeleton fornece feedback visual e `sr-only`/`role="status"` comunica o
estado às tecnologias assistivas.

### Erro

```tsx
{isError ? (
  <p className="mt-2 text-sm text-destructive" role="alert">
    Não foi possível carregar o detalhe deste pacote.
  </p>
) : null}
```

O erro aparece dentro do modal, sem remover filtros, paginação ou tabela.

### Conteúdo preservado

```tsx
<dl className="grid gap-4 text-sm sm:grid-cols-2">
  <div>
    <dt className="text-muted-foreground">Serviço</dt>
    <dd className="font-medium">{item.serviceName}</dd>
  </div>
  <div>
    <dt className="text-muted-foreground">Unidade</dt>
    <dd className="font-medium">{item.unitName}</dd>
  </div>
  <div>
    <dt className="text-muted-foreground">Sessões</dt>
    <dd className="font-medium">{item.totalSessions}</dd>
  </div>
  <div>
    <dt className="text-muted-foreground">Frequência semanal</dt>
    <dd className="font-medium">{item.weeklyFrequency} por semana</dd>
  </div>
  <div>
    <dt className="text-muted-foreground">Valor total</dt>
    <dd className="font-medium">R$ {item.totalPrice}</dd>
  </div>
  <div>
    <dt className="text-muted-foreground">Situação</dt>
    <dd>
      <Badge variant={item.active ? 'default' : 'outline'}>
        {item.active ? 'Ativo' : 'Inativo'}
      </Badge>
    </dd>
  </div>
</dl>

{item.description ? (
  <div>
    <p className="text-muted-foreground text-sm">Descrição</p>
    <p className="mt-1 text-sm">{item.description}</p>
  </div>
) : null}

<div>
  <p className="text-muted-foreground text-sm">Dias configurados</p>
  <p className="mt-1 text-sm">
    {item.weekDays.map((day) => weekDayLabels[day]).join(', ')}
  </p>
</div>
```

### Ações preservadas

```tsx
<div className="flex flex-wrap gap-2 border-t pt-4">
  <Button
    type="button"
    variant="outline"
    onClick={(event) => onEdit(item, event.currentTarget)}
  >
    Editar pacote
  </Button>
  <Button
    type="button"
    variant="outline"
    disabled={statusUpdating}
    onClick={() => onToggleStatus(item)}
  >
    {item.active ? 'Desativar' : 'Ativar'}
  </Button>
</div>
```

Não houve alteração nas mutations. O modal apenas continua chamando os mesmos
callbacks de edição e mudança de situação.

## 11. Passo 6 — nova composição da `PackagesPage`

### Código atual da tabela

```tsx
<section
  aria-label="Lista de pacotes"
  className="overflow-hidden rounded-xl border bg-white shadow-sm"
>
  <PackageTable
    items={items}
    selectedId={selectedId}
    isLoading={packages.isLoading}
    isFetching={packages.isFetching}
    statusUpdating={changeStatusState.isLoading}
    onSelect={selectPackage}
    onEdit={openEditModal}
    onToggleStatus={(item) => void toggleStatus(item)}
  />
  <PackagePagination
    page={packages.data?.page ?? page}
    totalPages={packages.data?.totalPages ?? 0}
    totalElements={packages.data?.totalElements ?? 0}
    last={packages.data?.last ?? true}
    disabled={packages.isFetching}
    onPageChange={(nextPage) => setPage(Math.max(nextPage, 0))}
  />
</section>
```

### Código atual do detalhe

```tsx
<PackageDetailPanel
  open={detailOpen}
  item={selectedItem}
  isLoading={detailQuery.isLoading}
  isError={detailQuery.isError}
  statusUpdating={changeStatusState.isLoading}
  onOpenChange={handleDetailOpenChange}
  onEdit={openEditModal}
  onToggleStatus={(item) => void toggleStatus(item)}
/>
```

O grid `xl:grid-cols-[...]` foi removido. O diálogo usa portal e overlay, então
não precisa consumir uma coluna da página.

## 12. Filtros e paginação

Ao filtrar ou limpar filtros, a página continua retornando para a primeira
página, limpando a seleção e fechando o detalhe:

```tsx
function applyFilters(nextFilters: ServicePackageFilters) {
  setFilters(nextFilters)
  setPage(0)
  setSelectedId(null)
  setDetailOpen(false)
}

function clearFilters() {
  setFilters({})
  setPage(0)
  setSelectedId(null)
  setDetailOpen(false)
}
```

A consulta permanece:

```tsx
const packages = useGetServicePackagesQuery(
  { ...filters, page, size: PAGE_SIZE },
  { skip: sessionQuery.isLoading || !isAdmin },
)
```

Não foram alterados `GET /api/service-packages`, `GET
/api/service-packages/{id}`, `POST /api/service-packages`, os `PATCH` de edição
e situação, nem os parâmetros de paginação e filtros.

## 13. Testes atualizados

### Listagem, filtro e paginação

```tsx
expect(screen.getByRole('main')).toHaveClass('overflow-x-hidden')
expect(
  screen.getByRole('form', { name: 'Filtros de pacotes' }),
).toBeVisible()
expect(screen.getByRole('button', { name: 'Detalhes' })).toBeVisible()
expect(screen.getByText('Total de 11 pacote(s)')).toBeVisible()
```

O teste continua verificando troca de página, `page=1`, `size=10`, filtro por
nome e retorno para `page=0`.

### Detalhe e edição

O teste anterior procurava `complementary`. Agora procura `dialog`:

```tsx
const detailDialog = await screen.findByRole('dialog', {
  name: 'Fisioterapia 10 sessões',
})

expect(detailDialog).toBeVisible()
expect(detailDialog).toContainElement(document.activeElement as HTMLElement)
expect(
  within(detailDialog).getByText('Recuperação funcional'),
).toBeVisible()
expect(within(detailDialog).getByText('Segunda, Quarta')).toBeVisible()
```

Também são verificadas as sequências:

1. abrir detalhe;
2. verificar foco dentro do modal;
3. abrir edição;
4. confirmar dados pré-preenchidos;
5. cancelar edição;
6. confirmar foco no botão `Detalhes`;
7. reabrir e fechar o detalhe pelo botão nomeado.

### Teclado e carregamento

```tsx
const row = await screen.findByRole('row', {
  name: /fisioterapia 10 sessões/i,
})
row.focus()
await user.keyboard('{Enter}')

expect(await screen.findByRole('status')).toHaveTextContent(
  'Carregando detalhe do pacote',
)
expect(
  await screen.findByRole('dialog', { name: 'Fisioterapia 10 sessões' }),
).toBeVisible()
```

O handler MSW aguarda 50 ms para tornar observável o estado de carregamento.

### Erro sem apagar a tabela

```tsx
http.get(
  'http://localhost:8080/api/service-packages/package-1',
  () => HttpResponse.json({ message: 'Falha' }, { status: 500 }),
)
```

Depois da abertura:

```tsx
expect(
  await screen.findByText(
    'Não foi possível carregar o detalhe deste pacote.',
  ),
).toBeVisible()
expect(screen.getByRole('alert')).toBeVisible()
```

Como o overlay torna o conteúdo de fundo `aria-hidden`, a tabela é verificada
com `{ hidden: true }` para confirmar que continua montada, embora não esteja
interativa enquanto o modal está aberto.

### Regressões preservadas

Continuam cobertos:

- criação e validações locais;
- alteração de situação;
- exibição de `Ativo` e `Inativo`;
- bloqueio da gestão para `BASIC`;
- ausência de consulta administrativa para não administradores.

## 14. README da feature

O README foi atualizado de:

```md
paginação, detalhe contextual, criação/edição em modal e
ativação/desativação.
```

Para:

```md
paginação em um container responsivo amplo, detalhe em modal, criação/edição em
modal e ativação/desativação.
```

Também passou a registrar:

```md
`PackagesPage` orquestra filtros aplicados, página, seleção, detalhe modal e
modo do modal de criação/edição. Em telas amplas, a listagem usa um container
mais largo; em telas estreitas, o overflow horizontal fica restrito à tabela.
```

E:

```md
- `PackageDetailPanel`: detalhe do pacote em diálogo modal responsivo, com foco
  acessível e ações administrativas;
```

## 15. Verificações executadas

### Testes da feature

```bash
npm run test -- src/features/packages --run
```

Resultado:

```text
Test Files  4 passed (4)
Tests       22 passed (22)
```

### Lint

```bash
npm run lint
```

Resultado: aprovado sem erros.

### Build

```bash
npm run build
```

Resultado: build de produção aprovado. O Vite exibiu somente o aviso conhecido
de chunks acima de `500 kB` após minificação. A otimização de bundle não fazia
parte do escopo e não foi alterada.

### Validação OpenSpec

```bash
openspec validate ajustar-container-e-detalhes-modal-pacotes --strict
```

Resultado:

```text
Change 'ajustar-container-e-detalhes-modal-pacotes' is valid
```

## 16. Escopo preservado

Não foram alterados:

- backend, endpoints, payloads ou rotas;
- autenticação, autorização de servidor ou isolamento de tenant;
- regras de imutabilidade após uso do pacote;
- cálculo de frequência, catálogo de serviços ou unidades;
- mutations de criação, edição e situação;
- paginação server-side;
- dependências do `package.json`;
- primitive global de `Dialog`.

O frontend continua sendo apenas a camada de apresentação e interação. A API
permanece autoridade para permissões, escopo, validação, imutabilidade e
integridade dos pacotes.

## 17. Checklist final

- [x] Container ampliado de `1600px` para `2048px`.
- [x] Overflow horizontal global contido no `main`.
- [x] Overflow da tabela mantido no próprio contêiner.
- [x] Grid mestre-detalhe removido.
- [x] Detalhe convertido de `<aside>` para `Dialog`.
- [x] Fechamento explícito em pt-BR.
- [x] Título acessível baseado no nome do pacote.
- [x] Foco inicial e retorno de foco cobertos.
- [x] Transição detalhe → edição sem dois modais concorrentes.
- [x] Carregamento comunicado com `role="status"`.
- [x] Erro comunicado com `role="alert"`.
- [x] Seleção por botão, clique e teclado coberta.
- [x] Filtros e paginação preservados.
- [x] Contratos HTTP preservados.
- [x] README atualizado.
- [x] 22 testes da feature aprovados.
- [x] Lint aprovado.
- [x] Build aprovado.
- [x] OpenSpec validado com `--strict`.
