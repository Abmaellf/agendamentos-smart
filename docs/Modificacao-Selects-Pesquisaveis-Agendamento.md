# Modificação dos selects pesquisáveis no agendamento

## Objetivo

Substituir os selects nativos do formulário de **Novo agendamento** por campos pesquisáveis com dropdown, lupa, filtro local e suporte à navegação por teclado.

O escopo deste documento cobre exclusivamente:

- `src/features/appointments/components/create-appointment-dialog.tsx`
- `src/components/searchable-select.tsx`

O componente `searchable-select.tsx` foi criado para concentrar o comportamento reutilizável de seleção e busca.

## Visão geral do fluxo

```text
Catálogo retornado pela API
          |
          v
CreateAppointmentDialog
  - transforma os dados em { id, label }
  - mantém o ID selecionado no AppointmentFormState
          |
          v
SearchableSelect
  - abre o dropdown
  - filtra localmente por nome
  - exibe lupa e opções
  - devolve somente o ID escolhido
          |
          v
FormField
  - associa label, id, erro e aria-describedby
```

## 1. Arquivo `create-appointment-dialog.tsx`

### 1.1 Importação do novo componente

Antes, o diálogo usava diretamente o elemento HTML `<select>`.

```tsx
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
```

Agora, o componente pesquisável é importado como uma dependência visual compartilhada:

```tsx
import { FormField } from '@/components/form-field'
import { SearchableSelect } from '@/components/searchable-select'
import { Button } from '@/components/ui/button'
```

### Motivo

O formulário continua responsável pelo estado e pelas regras de negócio, enquanto o comportamento visual de pesquisa fica isolado em um componente reutilizável.

### 1.2 Ajuste do ref do primeiro campo

O foco do primeiro campo inválido era direcionado para um `<select>`:

```tsx
const patientRef = useRef<HTMLSelectElement>(null)
```

Como o controle agora é um botão com semântica de `combobox`, o tipo do ref passou a ser:

```tsx
const patientRef = useRef<HTMLButtonElement>(null)
```

### Motivo

Quando o formulário é enviado incompleto, `patientRef.current?.focus()` precisa focar o controle visível do combobox. O novo componente encaminha esse ref para o botão que abre o dropdown.

### 1.3 Transformação dos catálogos

Antes, cada catálogo era percorrido diretamente dentro do JSX:

```tsx
{patientsQuery.data?.map((patient) => (
  <option key={patient.id} value={patient.id}>
    {patient.name}
  </option>
))}
```

Agora, os dados são transformados previamente para o formato genérico aceito pelo componente:

```tsx
const patientOptions = useMemo(
  () =>
    patientsQuery.data?.map((patient) => ({
      id: patient.id,
      label: patient.name,
    })) ?? [],
  [patientsQuery.data],
)
```

O mesmo padrão é usado para:

- `unitOptions`: unidades;
- `serviceOptions`: serviços;
- `professionalOptions`: profissionais.

### Motivo

O `SearchableSelect` não conhece pacientes, unidades ou profissionais. Ele recebe apenas uma lista genérica de opções com `id` e `label`, mantendo a separação entre apresentação e domínio.

### 1.4 Paciente: de select nativo para campo pesquisável

Antes:

```tsx
<select
  ref={patientRef}
  className={controlClassName}
  value={form.patientId}
  onChange={(event) =>
    setForm((current) => ({
      ...current,
      patientId: event.target.value,
    }))
  }
>
  <option value="">Selecione</option>
  {patientsQuery.data?.map((patient) => (
    <option key={patient.id} value={patient.id}>
      {patient.name}
    </option>
  ))}
</select>
```

Agora:

```tsx
<SearchableSelect
  ref={patientRef}
  options={patientOptions}
  loading={patientsQuery.isLoading}
  searchPlaceholder="Buscar paciente"
  className={controlClassName}
  value={form.patientId}
  onValueChange={(patientId) =>
    setForm((current) => ({ ...current, patientId }))
  }
/>
```

### O que foi preservado

- O formulário continua armazenando `patientId`.
- O valor enviado à API continua sendo o identificador do paciente.
- O estado de carregamento continua vindo de `patientsQuery.isLoading`.
- O rótulo e os erros continuam sendo fornecidos pelo `FormField`.

### 1.5 Unidade e serviço

O mesmo padrão foi aplicado à unidade:

```tsx
<SearchableSelect
  options={unitOptions}
  loading={unitsQuery.isLoading}
  searchPlaceholder="Buscar unidade"
  className={controlClassName}
  value={form.unitId}
  onValueChange={(unitId) =>
    setForm((current) => ({ ...current, unitId }))
  }
/>
```

E ao serviço:

```tsx
<SearchableSelect
  options={serviceOptions}
  loading={servicesQuery.isLoading}
  searchPlaceholder="Buscar serviço"
  className={controlClassName}
  value={form.serviceId}
  onValueChange={changeService}
/>
```

No serviço, o callback continua sendo `changeService`, em vez de um callback simples. Isso é importante porque a troca do serviço também:

1. limpa o profissional selecionado;
2. consulta os profissionais compatíveis;
3. atualiza duração e preço padrão;
4. respeita as regras de `ADMIN` e `BASIC`.

### 1.6 Profissional opcional e dependente do serviço

Antes, o profissional era representado por um select desabilitado enquanto não existia serviço:

```tsx
<select
  className={controlClassName}
  value={form.professionalId}
  disabled={!form.serviceId || professionalsQuery.isLoading}
>
  <option value="">Sem profissional</option>
  {/* profissionais retornados pela API */}
</select>
```

Agora:

```tsx
<SearchableSelect
  options={form.serviceId ? professionalOptions : []}
  loading={professionalsQuery.isLoading}
  placeholder="Sem profissional"
  searchPlaceholder="Buscar profissional"
  emptyLabel="Nenhum profissional disponível."
  className={controlClassName}
  value={form.professionalId}
  disabled={!form.serviceId}
  onValueChange={(professionalId) =>
    setForm((current) => ({ ...current, professionalId }))
  }
/>
```

### Motivos

- Sem serviço selecionado, o controle permanece desabilitado.
- A opção vazia continua representada por `id: ''` e label `Sem profissional`.
- O carregamento dos profissionais é exibido pelo próprio dropdown.
- A seleção continua armazenando apenas `professionalId`.
- A regra de filtragem por serviço continua sendo feita pela query existente.

## 2. Arquivo `searchable-select.tsx`

### 2.1 Responsabilidade do componente

O `SearchableSelect` é um componente controlado e apresentacional. Ele não acessa API, não conhece o formulário de agendamento e não possui regras específicas de paciente, unidade, serviço ou profissional.

Sua entrada principal é:

```tsx
export interface SearchableSelectOption {
  id: string
  label: string
}
```

O componente recebe o catálogo, o valor atual e o callback de mudança:

```tsx
export interface SearchableSelectProps {
  options: readonly SearchableSelectOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  loading?: boolean
  disabled?: boolean
  // demais textos e propriedades visuais
}
```

### Motivo

O componente pode ser reutilizado por qualquer formulário que precise pesquisar opções locais, sem depender da feature de agendamentos.

### 2.2 Normalização da busca

A busca usa uma função de normalização:

```tsx
function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim()
}
```

O filtro é aplicado somente em memória:

```tsx
const filteredOptions = useMemo(() => {
  const query = normalize(search)
  if (!query) return options

  return options.filter((option) => normalize(option.label).includes(query))
}, [options, search])
```

### Resultado prático

Uma busca por `ana` encontra `Ána Paciente`. A comparação:

- ignora maiúsculas e minúsculas;
- ignora acentos;
- aceita o trecho em qualquer posição do nome;
- não executa uma chamada HTTP a cada caractere.

### 2.3 Estado temporário e valor confirmado

O componente separa o texto digitado da opção selecionada:

```tsx
const [open, setOpen] = useState(false)
const [search, setSearch] = useState('')
const [activeIndex, setActiveIndex] = useState(0)
```

O valor confirmado continua vindo da propriedade `value`. A busca pode ser apagada ou cancelada sem alterar a seleção atual.

Quando uma opção é escolhida:

```tsx
function selectOption(option: SearchableSelectOption) {
  onValueChange(option.id)
  close()
}
```

Quando o dropdown fecha:

```tsx
function close() {
  setOpen(false)
  setSearch('')
}
```

### Motivo

Isso evita que um texto digitado, mas não confirmado, seja confundido com uma seleção válida do formulário.

### 2.4 Controle visível e acessibilidade

O campo principal é um botão com semântica de combobox:

```tsx
<button
  ref={forwardedRef}
  id={triggerId}
  type="button"
  role="combobox"
  aria-expanded={open}
  aria-controls={listboxId}
  aria-haspopup="listbox"
  aria-describedby={ariaDescribedBy}
>
  {/* valor selecionado ou placeholder */}
</button>
```

O `id` e o `aria-describedby` permitem que o controle continue funcionando com o `FormField`. O `FormField` pode associar o label e o texto de erro sem conhecer a implementação interna do dropdown.

### 2.5 Dropdown e lupa

Ao abrir, o componente exibe um campo de busca dentro do popover:

```tsx
<div className="relative">
  <Search aria-hidden="true" />
  <Input
    ref={searchInputRef}
    value={search}
    placeholder={searchPlaceholder}
    aria-label={searchPlaceholder}
    onChange={(event) => {
      setSearch(event.target.value)
      setActiveIndex(0)
    }}
  />
</div>
```

A lupa é visual e decorativa (`aria-hidden="true"`), enquanto o input possui um nome acessível próprio, como `Buscar paciente` ou `Buscar serviço`.

### 2.6 Estados do dropdown

O componente trata três estados principais da lista:

```tsx
{loading ? (
  <p role="status">Carregando opções...</p>
) : filteredOptions.length > 0 ? (
  // opções filtradas
) : (
  <p>{search ? noResultsLabel : emptyLabel}</p>
)}
```

Assim, o usuário diferencia:

- catálogo ainda carregando;
- busca sem correspondência;
- catálogo sem opções disponíveis.

### 2.7 Seleção por mouse e teclado

Cada opção possui semântica de `option` e informa se está selecionada:

```tsx
<button
  role="option"
  aria-selected={option.id === value}
  onClick={() => selectOption(option)}
>
  {option.label}
</button>
```

O campo também trata:

- `Enter`, `Espaço` e `ArrowDown` para abrir;
- `ArrowDown` e `ArrowUp` para percorrer as opções;
- `Enter` para confirmar a opção ativa;
- `Escape` para fechar sem alterar o valor;
- `Tab` para continuar a navegação do formulário.

## 3. Comparação final

### Antes

- Lista completa sempre apresentada pelo `<select>` nativo.
- Busca dependente do comportamento padrão do navegador.
- Nenhuma lupa ou filtro por trecho dentro do dropdown.
- Quatro implementações de opções diretamente no diálogo.

### Agora

- Dropdown customizado com busca local.
- Lupa visível dentro da área de pesquisa.
- Filtro por trecho, caixa e acentuação.
- Componente único reutilizável para os quatro catálogos.
- IDs do formulário preservados.
- Erros, labels, foco e `aria-describedby` mantidos pelo `FormField`.
- Nenhuma chamada HTTP adicional causada pela digitação.

## 4. Motivo geral da alteração

A alteração melhora a eficiência para catálogos maiores sem modificar o contrato de criação do agendamento. O formulário continua enviando os mesmos identificadores e valores; apenas a forma de localizar e selecionar os registros foi aprimorada.
