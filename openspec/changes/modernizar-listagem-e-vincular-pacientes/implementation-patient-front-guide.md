# Guia de implementação do frontend de pacientes

## 1. Objetivo

Este documento é a parte **frontend** do guia técnico da change
`modernizar-listagem-e-vincular-pacientes`. Ele substitui, para a execução do
frontend, as seções equivalentes do arquivo [`implementation-guide.md`](implementation-guide.md).
O guia do backend será criado separadamente em
`implementation-patient-back-guide.md`, após autorização explícita.

O objetivo é entregar a rota `/paciente` com:

- uma única fonte de dados remotos, usando RTK Query;
- listagem paginada e filtrada de verdade;
- cadastro pelo contrato `POST /patient/save`;
- vínculo obrigatório com uma ou mais unidades autorizadas;
- unidade ativa fixa para usuário `BASIC`;
- seleção de unidades da clínica para usuário `ADMIN`;
- estados de carregamento, erro, vazio e sucesso;
- apresentação visual mais rica, próxima à imagem de referência;
- ausência explícita (`—`) quando status ou serviço principal não forem
  fornecidos pelo backend;
- testes de integração que validem payload, filtros, paginação e erros.

Este arquivo é um roteiro de implementação. Ele **não implementa o código de
produção por si só**. A execução deve continuar obedecendo a
[`proposal.md`](proposal.md), [`design.md`](design.md),
[`tasks.md`](tasks.md) e à
[`spec delta`](specs/legacy-patient-management/spec.md).

## 2. Decisões já consolidadas

### 2.1 Fonte de verdade do paciente

O frontend deve usar apenas estes endpoints:

```text
GET  /patient/list
POST /patient/save
```

O fluxo legado `POST patients`, sem barra inicial e no plural, deve ser
removido. A tela também deve deixar de usar `PatientContext` para armazenar
dados vindos da API.

### 2.2 Clínica e unidades

O frontend **não envia `clinicId`** na criação. A clínica deve ser resolvida e
validada pelo backend a partir da sessão autenticada.

O frontend envia:

```json
{
  "name": "Beatriz",
  "unitIds": ["unit-a"]
}
```

Para `BASIC`, `unitIds` é derivado de `session.activeUnitId` e não pode ser
editado. Para `ADMIN`, os IDs são selecionados somente entre as unidades
retornadas por `GET /api/units`.

Essa restrição visual melhora a experiência, mas não substitui a autorização
do backend.

### 2.3 Status e serviço principal

As últimas decisões de contrato do backend adicionam ao response:

```text
status: string | null
principalService: PrincipalServiceResponse | null
```

O novo record de backend `PrincipalServiceResponse` representa somente `id` e
`name`. Criar esse record não cria uma regra de domínio para descobrir o
serviço principal. Enquanto o backend não possuir uma fonte confiável, deve
retornar `principalService = null`.

O frontend deve, portanto, aceitar `null`/ausência e renderizar `—`. É
proibido preencher `Pilates`, `Ativo`, uma data ou qualquer outro dado fixo
apenas para reproduzir a imagem.

### 2.4 Filtros

O código-alvo abaixo implementa os parâmetros:

```text
name
status
serviceId
page
size
```

Os controles de status e serviço somente devem ser liberados junto com o
backend que realmente aplicar esses parâmetros. Se essa parte do backend não
entrar na mesma entrega, remova temporariamente os dois controles e não envie
os parâmetros; não mantenha filtros decorativos.

### 2.5 Edição, detalhe e desativação

Os botões aparecem para preservar a hierarquia visual, mas permanecem
desabilitados nesta change. Eles só podem ser ativados quando existirem
endpoint, autorização, confirmação, tratamento de erro e testes próprios.

## 3. Contrato HTTP consumido pelo frontend

### 3.1 Listagem

Request:

```http
GET /patient/list?page=0&size=5&name=Ana&status=ATIVO&serviceId=service-pilates
```

Response:

```json
{
  "content": [
    {
      "id": "patient-a",
      "code": 1,
      "name": "Ana Oliveira",
      "clinicId": "tenant-a",
      "unitIds": ["unit-a"],
      "createdAt": "2025-10-21T12:00:00Z",
      "status": "ATIVO",
      "principalService": {
        "id": "service-pilates",
        "name": "Pilates"
      }
    }
  ],
  "page": 0,
  "size": 5,
  "totalElements": 1,
  "totalPages": 1,
  "last": true
}
```

Quando não houver fonte de domínio:

```json
{
  "status": null,
  "principalService": null
}
```

### 3.2 Criação

Request:

```http
POST /patient/save
Content-Type: application/json
```

```json
{
  "name": "Beatriz",
  "unitIds": ["unit-a"]
}
```

Resposta esperada: `201 Created` com um `PatientListItem`. Se o backend
preservar temporariamente `200 OK`, a mutation continua funcionando, mas os
testes de contrato devem registrar essa compatibilidade.

### 3.3 Erros

| Código                      | Tratamento no frontend                              |
| --------------------------- | --------------------------------------------------- |
| `VALIDATION_ERROR`          | manter o formulário e pedir revisão do nome/unidade |
| `PATIENT_ALREADY_EXISTS`    | informar duplicidade                                |
| `CLINIC_ACCESS_DENIED`      | informar que a sessão não pode usar a clínica       |
| `UNIT_ACCESS_DENIED`        | informar limite da unidade ativa                    |
| `TENANT_RESOURCE_NOT_FOUND` | informar que a unidade não está disponível          |
| `FETCH_ERROR`               | informar falha de conexão e permitir nova tentativa |

## 4. Inventário completo da mudança

### 4.1 Arquivos novos

| Arquivo                                                     | Intuito                                                    |
| ----------------------------------------------------------- | ---------------------------------------------------------- |
| `src/features/patients/api/patients.ts`                     | concentrar listagem e criação no mesmo adaptador RTK Query |
| `src/features/patients/model/patient-errors.ts`             | traduzir erros técnicos em mensagens seguras e estáveis    |
| `src/features/patients/components/patient-status-badge.tsx` | apresentar o status sem misturar regra visual com a linha  |
| `src/test/builders/patient.ts`                              | fornecer fixtures tipadas específicas da feature           |

### 4.2 Arquivos atualizados

| Arquivo                                                               | Alteração                                                 |
| --------------------------------------------------------------------- | --------------------------------------------------------- |
| `src/@types/patient.ts`                                               | substituir tipos do contexto legado pelos contratos reais |
| `src/features/patients/components/add-patient-modal.tsx`              | adicionar sessão, unidades, payload correto e erros       |
| `src/features/patients/components/patient-table-filter.tsx`           | transformar filtros em estado controlado e remoto         |
| `src/features/patients/components/patient-table-rows.tsx`             | usar todos os dados reais do paciente                     |
| `src/features/patients/components/pagination.tsx`                     | adicionar callbacks e limites funcionais                  |
| `src/features/patients/pages/patients-page.tsx`                       | usar RTK Query, filtros, estados e novo layout            |
| `src/App.tsx`                                                         | remover `PatientProvider` global                          |
| `src/test/render.tsx`                                                 | remover `PatientProvider` dos testes                      |
| `src/test/server.ts`                                                  | simular contrato paginado, criação, sessão e erros        |
| `src/features/patients/__tests__/patient-create.integration.test.tsx` | validar `BASIC`, `ADMIN` e erros de criação               |
| `src/features/patients/__tests__/patients-page.integration.test.tsx`  | validar dados, filtros, paginação, vazio e retry          |
| `src/features/patients/README.md`                                     | documentar a arquitetura final da feature                 |
| `src/@types/README.md`                                                | remover menções aos tipos legados de contexto             |
| `src/context/README.md`                                               | registrar remoção do contexto remoto de pacientes         |
| `src/api/README.md`                                                   | apontar para o novo adaptador consolidado                 |
| `src/features/README.md`                                              | marcar pacientes como implementado no escopo da change    |

### 4.3 Arquivos removidos

| Arquivo                                                      | Motivo                                             |
| ------------------------------------------------------------ | -------------------------------------------------- |
| `src/features/patients/api/register-patient.ts`              | substituído pelo adaptador completo `patients.ts`  |
| `src/features/patients/model/patient-context.tsx`            | estado remoto passa a ser gerenciado por RTK Query |
| `src/features/patients/components/create-patient-dialog.tsx` | usa o endpoint legado `POST patients`              |

### 4.4 Arquivos preservados

- `src/Router.tsx`: a rota `/paciente` já está correta;
- `src/lib/base-api.ts`: `PatientCatalog` já existe em `tagTypes`;
- `src/lib/axios-base-query.ts`: o formato `{ status, data }` já é suficiente;
- `src/features/appointments/api/appointments.ts`: os hooks de sessão, unidades
  e serviços serão reutilizados sem duplicação;
- componentes-base em `src/components/ui`: não é necessário instalar
  dependência nem criar outro design system.

## 5. Ordem de implementação

Implemente nesta sequência para manter o TypeScript coerente:

1. atualizar `src/@types/patient.ts`;
2. criar `patients.ts` e `patient-errors.ts`;
3. criar `patient-status-badge.tsx`;
4. atualizar modal, filtro, linha e paginação;
5. atualizar a página;
6. remover contexto, diálogo legado e provider;
7. criar fixtures e atualizar MSW;
8. atualizar testes;
9. atualizar READMEs;
10. executar testes, lint, build e validação OpenSpec.

## 6. Tipos compartilhados

### Arquivo atualizado: `src/@types/patient.ts`

#### Como é hoje

O arquivo mistura contratos de contexto, Axios, formulário e tabela e modela a
criação somente com nome:

```ts
export interface PatientContextValue {
  patients: PatientContextItem[]
  fetchPatients: () => Promise<AxiosResponse>
  createPatient: (data: CreatePatientInput) => Promise<void>
}

export interface CreatePatientInput {
  name: string
}

export interface PatientTableRowsProps {
  patientObj: {
    name: string
  }
}

export interface PaginationProps {
  pageIndex: number
  perPage: number
  totalCount: number
}
```

#### Como deve ficar — arquivo completo

```ts
export type PatientStatus = 'ATIVO' | 'INATIVO' | 'EM_ATENDIMENTO'

export interface PatientPrincipalService {
  id: string
  name: string
}

export interface PatientListItem {
  id: string
  code: number
  name: string
  clinicId: string
  unitIds: string[]
  createdAt: string
  status?: PatientStatus | null
  principalService?: PatientPrincipalService | null
}

export interface PatientListResponse {
  content: PatientListItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface PatientListQuery {
  page: number
  size: number
  name?: string
  status?: PatientStatus
  serviceId?: string
}

export interface PatientFilters {
  name: string
  status?: PatientStatus
  serviceId?: string
}

export interface PatientServiceOption {
  id: string
  name: string
}

export interface CreatePatientInput {
  name: string
  unitIds: string[]
}

export interface CreatePatientFormValues {
  name: string
  unitIds: string[]
}

export interface PatientTableFilterProps {
  value: PatientFilters
  services: PatientServiceOption[]
  servicesLoading: boolean
  disabled?: boolean
  onApply: (filters: PatientFilters) => void
  onClear: () => void
}

export interface PatientTableRowsProps {
  patient: PatientListItem
}

export interface PaginationProps {
  pageIndex: number
  totalPages: number
  totalCount: number
  isLast: boolean
  onFirst: () => void
  onPrevious: () => void
  onNext: () => void
  onLast: () => void
}
```

#### Explicação teórica

- `PatientListItem` espelha a projeção da API, não a entidade de banco;
- `status` e `principalService` aceitam ausência para não inventar domínio;
- `PatientListResponse` reutiliza exatamente os metadados de
  `PageResponseDTO` do backend;
- `PatientListQuery` separa parâmetros de transporte dos controles visuais;
- `PatientFilters` representa apenas filtros confirmados pela pessoa;
- `CreatePatientInput` obriga o vínculo com unidade em tempo de compilação;
- os tipos de `PatientContext` e `AxiosResponse` deixam de existir porque
  infraestrutura remota não será mais exposta por contexto React.

## 7. Adaptador RTK Query

### Arquivo novo: `src/features/patients/api/patients.ts`

#### Intuito

Este arquivo passa a ser o único adaptador HTTP de pacientes. O nome do
endpoint de query é `getPatientPage`, e não `getPatients`, para não colidir com
`useGetPatientsQuery` já exportado pela feature de agenda.

#### Código completo

```ts
import type {
  CreatePatientInput,
  PatientListItem,
  PatientListQuery,
  PatientListResponse,
} from '@/@types/patient'
import { baseApi } from '@/lib/base-api'

export const patientsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPatientPage: builder.query<PatientListResponse, PatientListQuery>({
      query: ({ page, size, name, status, serviceId }) => ({
        url: '/patient/list',
        params: {
          page,
          size,
          name: name || undefined,
          status: status || undefined,
          serviceId: serviceId || undefined,
        },
      }),
      providesTags: (result) =>
        result
          ? [
              { type: 'PatientCatalog' as const, id: 'LIST' },
              ...result.content.map((patient) => ({
                type: 'PatientCatalog' as const,
                id: patient.id,
              })),
            ]
          : [{ type: 'PatientCatalog' as const, id: 'LIST' }],
    }),
    registerPatient: builder.mutation<PatientListItem, CreatePatientInput>({
      query: (data) => ({
        url: '/patient/save',
        method: 'POST',
        data,
        headers: { 'Content-Type': 'application/json' },
      }),
      invalidatesTags: [{ type: 'PatientCatalog', id: 'LIST' }],
    }),
  }),
})

export const { useGetPatientPageQuery, useRegisterPatientMutation } =
  patientsApi
```

#### Por que invalidar a tag `LIST`

Ao concluir o cadastro, a mutation invalida a página listada. O RTK Query
refaz a consulta ativa e a tabela recebe o novo total sem `fetchPatients()`
manual, `useEffect` ou mutação local do array.

### Arquivo removido: `src/features/patients/api/register-patient.ts`

#### Como é hoje

```ts
registerPatient: builder.mutation<void, CreatePatientInput>({
  query: (data) => ({
    url: '/patient/save',
    method: 'POST',
    data,
    headers: { 'Content-Type': 'application/json' },
  }),
})
```

#### Como será

O arquivo será removido depois que todos os imports apontarem para
`../api/patients`. A mutation deixa de retornar `void`, recebe `unitIds` e
invalida `PatientCatalog/LIST`, conforme o arquivo novo completo acima.

## 8. Tratamento de erros

### Arquivo novo: `src/features/patients/model/patient-errors.ts`

#### Intuito

Centralizar a interpretação do erro de `axiosBaseQuery`, impedir casts
duplicados nos componentes e garantir mensagens seguras. O parser não exibe
IDs, stack traces nem mensagens desconhecidas devolvidas por serviços
internos.

#### Código completo

```ts
import type { AxiosBaseQueryError } from '@/lib/axios-base-query'

interface PatientApiErrorPayload {
  code?: string
  message?: string
  fieldErrors?: Record<string, string[]>
}

type PatientOperation = 'create' | 'list'

function payloadOf(error: unknown) {
  if (!error || typeof error !== 'object' || !('data' in error)) {
    return undefined
  }

  return (error as Partial<AxiosBaseQueryError>).data as
    | PatientApiErrorPayload
    | undefined
}

export function patientErrorMessage(
  error: unknown,
  operation: PatientOperation,
) {
  const queryError = error as Partial<AxiosBaseQueryError> | undefined

  if (queryError?.status === 'FETCH_ERROR') {
    return 'Não foi possível conectar ao servidor. Tente novamente.'
  }

  switch (payloadOf(error)?.code) {
    case 'PATIENT_ALREADY_EXISTS':
      return 'Já existe um paciente com esse nome.'
    case 'CLINIC_ACCESS_DENIED':
      return 'Sua sessão não pode cadastrar pacientes nesta clínica.'
    case 'UNIT_ACCESS_DENIED':
      return 'Você só pode cadastrar pacientes na sua unidade autorizada.'
    case 'TENANT_RESOURCE_NOT_FOUND':
      return 'A unidade selecionada não está disponível para esta clínica.'
    case 'VALIDATION_ERROR':
      return 'Revise o nome e as unidades selecionadas.'
    default:
      return operation === 'create'
        ? 'Não foi possível cadastrar o paciente. Tente novamente.'
        : 'Não foi possível carregar os pacientes. Tente novamente.'
  }
}
```

#### Observação

`fieldErrors` fica modelado para evolução, mas o código inicial não deve
adivinhar os nomes dos campos enviados pelo backend. Quando o contrato de
`fieldErrors` for confirmado, o modal poderá usar `setError` para vincular
mensagens específicas a `name` e `unitIds`.

## 9. Apresentação do status

### Arquivo novo: `src/features/patients/components/patient-status-badge.tsx`

#### Intuito

Isolar a tradução entre o enum do contrato e sua apresentação. Isso evita
condicionais espalhadas pela tabela e garante que texto, ícone e cor sejam
aplicados juntos. A informação continua compreensível sem depender somente de
cor.

#### Código completo

```tsx
import type { PatientStatus } from '@/@types/patient'
import { Badge } from '@/components/ui/badge'
import { CircleCheck, CirclePause, Clock3 } from 'lucide-react'

interface PatientStatusBadgeProps {
  status?: PatientStatus | null
}

export function PatientStatusBadge({ status }: PatientStatusBadgeProps) {
  switch (status) {
    case 'ATIVO':
      return (
        <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800">
          <CircleCheck aria-hidden="true" />
          Ativo
        </Badge>
      )
    case 'EM_ATENDIMENTO':
      return (
        <Badge className="border-amber-200 bg-amber-100 text-amber-900">
          <Clock3 aria-hidden="true" />
          Em atendimento
        </Badge>
      )
    case 'INATIVO':
      return (
        <Badge className="border-slate-300 bg-slate-700 text-white">
          <CirclePause aria-hidden="true" />
          Inativo
        </Badge>
      )
    default:
      return <span className="text-muted-foreground">—</span>
  }
}
```

Se o backend devolver `null`, o componente não conclui que o paciente está
ativo; ele mostra `—`.

## 10. Cadastro de paciente

### Arquivo atualizado: `src/features/patients/components/add-patient-modal.tsx`

#### Como é hoje

O formulário valida somente nome, envia payload incompleto, registra dados no
console e simula processamento com dois segundos de espera:

```tsx
const createPatientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
})

await addPatient({
  name: data.name,
}).unwrap()

console.log(data)
await new Promise((resolve) => setTimeout(resolve, 2000))
```

Também existe um `Dialog` externo na página envolvendo o `Dialog` interno do
modal. Essa composição duplicada será eliminada; `AddPatientModal` será o
único proprietário de abertura, fechamento e reset.

#### Como deve ficar — arquivo completo

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, PlusCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import type { CreatePatientFormValues } from '@/@types/patient'
import { FormField } from '@/components/form-field'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  useGetAppointmentSessionQuery,
  useGetUnitsQuery,
} from '@/features/appointments/api/appointments'

import { useRegisterPatientMutation } from '../api/patients'
import { patientErrorMessage } from '../model/patient-errors'

const createPatientSchema: z.ZodType<
  CreatePatientFormValues,
  CreatePatientFormValues
> = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  unitIds: z
    .array(z.string().min(1))
    .min(1, 'Selecione pelo menos uma unidade'),
})

const emptyForm: CreatePatientFormValues = {
  name: '',
  unitIds: [],
}

export function AddPatientModal() {
  const [open, setOpen] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const sessionQuery = useGetAppointmentSessionQuery(undefined, {
    skip: !open,
  })
  const unitsQuery = useGetUnitsQuery(undefined, { skip: !open })
  const [registerPatient, registerPatientState] = useRegisterPatientMutation()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreatePatientFormValues>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: emptyForm,
  })

  const session = sessionQuery.data
  const units = unitsQuery.data ?? []
  const selectedUnitIds = watch('unitIds')
  const isBasic = session?.user.role === 'BASIC'
  const activeUnit = units.find((unit) => unit.id === session?.activeUnitId)
  const dependenciesLoading = sessionQuery.isLoading || unitsQuery.isLoading
  const dependenciesFailed = sessionQuery.isError || unitsQuery.isError

  useEffect(() => {
    if (!open || !isBasic) return

    setValue('unitIds', activeUnit ? [activeUnit.id] : [], {
      shouldValidate: true,
    })
  }, [activeUnit, isBasic, open, setValue])

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    setApiError(null)

    if (!nextOpen) {
      reset(emptyForm)
    }
  }

  function toggleAdminUnit(unitId: string, checked: boolean) {
    const nextUnitIds = checked
      ? [...new Set([...selectedUnitIds, unitId])]
      : selectedUnitIds.filter((id) => id !== unitId)

    setValue('unitIds', nextUnitIds, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  async function handlePatient(data: CreatePatientFormValues) {
    setApiError(null)

    const resolvedUnitIds = isBasic
      ? activeUnit
        ? [activeUnit.id]
        : []
      : data.unitIds

    if (resolvedUnitIds.length === 0) {
      setApiError('Nenhuma unidade autorizada está disponível para o cadastro.')
      return
    }

    try {
      await registerPatient({
        name: data.name.trim(),
        unitIds: resolvedUnitIds,
      }).unwrap()

      toast.success('Paciente cadastrado com sucesso', {
        position: 'bottom-center',
      })
      handleOpenChange(false)
    } catch (error) {
      const message = patientErrorMessage(error, 'create')
      setApiError(message)
      toast.error(message, { position: 'bottom-center' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
          <PlusCircle aria-hidden="true" />
          Novo Paciente
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Paciente</DialogTitle>
          <DialogDescription>
            Cadastre o paciente e vincule-o às unidades autorizadas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handlePatient)} className="space-y-5">
          <FormField label="Paciente" error={errors.name?.message}>
            <Input
              type="text"
              placeholder="Nome completo"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
          </FormField>

          <fieldset className="space-y-2" disabled={dependenciesLoading}>
            <legend className="text-sm font-medium">Unidades</legend>

            {dependenciesLoading ? (
              <p role="status" className="text-muted-foreground text-sm">
                Carregando unidades autorizadas...
              </p>
            ) : null}

            {isBasic && activeUnit ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                <p className="font-medium text-emerald-900">
                  {activeUnit.name}
                </p>
                <p className="text-sm text-emerald-700">
                  Unidade ativa definida pela sua sessão.
                </p>
              </div>
            ) : null}

            {isBasic && !dependenciesLoading && !activeUnit ? (
              <Alert variant="destructive">
                <AlertDescription>
                  A unidade ativa da sessão não está disponível no catálogo.
                </AlertDescription>
              </Alert>
            ) : null}

            {session?.user.role === 'ADMIN' ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {units.map((unit) => (
                  <label
                    key={unit.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-emerald-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUnitIds.includes(unit.id)}
                      onChange={(event) =>
                        toggleAdminUnit(unit.id, event.target.checked)
                      }
                    />
                    <span className="text-sm font-medium">{unit.name}</span>
                  </label>
                ))}
              </div>
            ) : null}

            {session?.user.role === 'ADMIN' && units.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhuma unidade autorizada foi encontrada.
              </p>
            ) : null}

            {errors.unitIds?.message ? (
              <p className="text-sm text-red-700">{errors.unitIds.message}</p>
            ) : null}
          </fieldset>

          {dependenciesFailed ? (
            <Alert variant="destructive">
              <AlertDescription>
                Não foi possível carregar sua sessão e suas unidades.
              </AlertDescription>
            </Alert>
          ) : null}

          {apiError ? (
            <Alert variant="destructive">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                dependenciesLoading ||
                dependenciesFailed ||
                registerPatientState.isLoading ||
                (isBasic && !activeUnit)
              }
            >
              {registerPatientState.isLoading ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : null}
              {registerPatientState.isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

#### Regras importantes do modal

1. O hook de sessão e o catálogo só consultam enquanto o modal está aberto.
2. `BASIC` nunca usa o valor de um checkbox; o payload é recalculado com a
   unidade ativa.
3. A unidade ativa precisa existir no catálogo autorizado antes do submit.
4. `ADMIN` pode escolher uma ou mais unidades, sem digitar IDs manualmente.
5. O modal só fecha após a resposta de sucesso.
6. Erros preservam os valores do formulário.
7. Não existe `clinicId`, `empresa`, `status`, `createdAt` ou UUID gerado no
   cliente.

## 11. Filtros remotos

### Arquivo atualizado: `src/features/patients/components/patient-table-filter.tsx`

#### Como é hoje

O formulário busca novamente os mesmos dados e apenas imprime o nome:

```tsx
async function handleSearchPatient(data: PatientTableFilterFormValues) {
  await fetchPatients()
  console.log(data)
}
```

#### Como deve ficar — arquivo completo

```tsx
import { Grid2X2, RotateCcw, Search } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'

import type {
  PatientFilters,
  PatientStatus,
  PatientTableFilterProps,
} from '@/@types/patient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ALL = 'ALL'

interface FilterDraft {
  name: string
  status: PatientStatus | typeof ALL
  serviceId: string
}

function draftFrom(value: PatientFilters): FilterDraft {
  return {
    name: value.name,
    status: value.status ?? ALL,
    serviceId: value.serviceId ?? ALL,
  }
}

export function PatientTableFilter({
  value,
  services,
  servicesLoading,
  disabled = false,
  onApply,
  onClear,
}: PatientTableFilterProps) {
  const [draft, setDraft] = useState<FilterDraft>(() => draftFrom(value))

  useEffect(() => {
    setDraft(draftFrom(value))
  }, [value])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onApply({
      name: draft.name.trim(),
      status: draft.status === ALL ? undefined : draft.status,
      serviceId: draft.serviceId === ALL ? undefined : draft.serviceId,
    })
  }

  function handleClear() {
    setDraft({ name: '', status: ALL, serviceId: ALL })
    onClear()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_minmax(200px,0.7fr)_minmax(220px,0.8fr)_auto_auto]"
    >
      <label className="relative">
        <span className="sr-only">Nome do paciente</span>
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          value={draft.name}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
          placeholder="Nome do paciente..."
          className="h-11 pl-9"
          disabled={disabled}
        />
      </label>

      <Select
        value={draft.status}
        onValueChange={(status) =>
          setDraft((current) => ({
            ...current,
            status: status as PatientStatus | typeof ALL,
          }))
        }
        disabled={disabled}
      >
        <SelectTrigger className="h-11 w-full" aria-label="Status do paciente">
          <SelectValue placeholder="Todos os status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos os status</SelectItem>
          <SelectItem value="ATIVO">Ativo</SelectItem>
          <SelectItem value="EM_ATENDIMENTO">Em atendimento</SelectItem>
          <SelectItem value="INATIVO">Inativo</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={draft.serviceId}
        onValueChange={(serviceId) =>
          setDraft((current) => ({ ...current, serviceId }))
        }
        disabled={disabled || servicesLoading}
      >
        <SelectTrigger
          className="h-11 w-full"
          aria-label="Serviço principal do paciente"
        >
          <Grid2X2 aria-hidden="true" />
          <SelectValue
            placeholder={
              servicesLoading ? 'Carregando...' : 'Todos os serviços'
            }
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos os serviços</SelectItem>
          {services.map((service) => (
            <SelectItem key={service.id} value={service.id}>
              {service.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="submit" variant="secondary" disabled={disabled}>
        <Search aria-hidden="true" />
        Filtrar
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={handleClear}
        disabled={disabled}
      >
        <RotateCcw aria-hidden="true" />
        Limpar filtros
      </Button>
    </form>
  )
}
```

O estado `draft` permite digitar sem disparar request a cada tecla. Somente o
submit promove os valores para os filtros confirmados da página.

## 12. Linha da tabela

### Arquivo atualizado: `src/features/patients/components/patient-table-rows.tsx`

#### Como é hoje

```tsx
<TableCell className="font-medium">0001</TableCell>
<TableCell className="font-medium">{patientObj.name}</TableCell>
<span className="h-2 w-2 rounded-full bg-slate-400" />
<TableCell className="text-muted-foreground">21/10/2025</TableCell>
```

Código, status e data são fixos e o componente ignora clínica, unidades e
serviço principal.

#### Como deve ficar — arquivo completo

```tsx
import type { PatientTableRowsProps } from '@/@types/patient'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { ArrowRight, Search, Stethoscope, Trash2 } from 'lucide-react'

import { PatientStatusBadge } from './patient-status-badge'

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatCode(code: number) {
  return String(code).padStart(4, '0')
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('pt-BR').format(date)
}

export default function PatientTableRows({ patient }: PatientTableRowsProps) {
  return (
    <TableRow className="odd:bg-white even:bg-emerald-50/40">
      <TableCell>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Ver detalhes de ${patient.name}`}
          title="Detalhes serão disponibilizados em uma próxima etapa"
          disabled
        >
          <Search aria-hidden="true" />
        </Button>
      </TableCell>

      <TableCell className="font-semibold text-emerald-800">
        {formatCode(patient.code)}
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-900"
          >
            {initials(patient.name)}
          </span>
          <span className="font-semibold">{patient.name}</span>
        </div>
      </TableCell>

      <TableCell>
        {patient.principalService ? (
          <span className="flex items-center gap-2">
            <Stethoscope
              className="size-4 text-emerald-700"
              aria-hidden="true"
            />
            {patient.principalService.name}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>

      <TableCell>
        <PatientStatusBadge status={patient.status} />
      </TableCell>

      <TableCell>{formatDate(patient.createdAt)}</TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            title="Edição será disponibilizada em uma próxima etapa"
            disabled
          >
            <ArrowRight aria-hidden="true" />
            Editar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            title="Desativação será disponibilizada em uma próxima etapa"
            disabled
          >
            <Trash2 aria-hidden="true" />
            Desativar
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
```

O avatar é construído com HTML/CSS e iniciais; não é necessário criar outro
componente-base ou instalar biblioteca.

## 13. Paginação funcional

### Arquivo atualizado: `src/features/patients/components/pagination.tsx`

#### Como é hoje

Os quatro botões não possuem `onClick` ou `disabled`, e o primeiro/último usam
os mesmos ícones de anterior/próximo:

```tsx
<Button variant="outline" className="h-8 w-8 p-0">
  <ChevronLeft />
  <span className="sr-only">Primeira página</span>
</Button>
```

#### Como deve ficar — arquivo completo

```tsx
import type { PaginationProps } from '@/@types/patient'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'

export function Pagination({
  pageIndex,
  totalPages,
  totalCount,
  isLast,
  onFirst,
  onPrevious,
  onNext,
  onLast,
}: PaginationProps) {
  const normalizedTotalPages = Math.max(totalPages, 1)
  const isFirst = pageIndex <= 0

  return (
    <div className="flex flex-col gap-4 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted-foreground text-sm">
        Total de {totalCount} item(s)
      </span>

      <div className="flex items-center gap-4">
        <div className="text-sm font-medium">
          Página {Math.min(pageIndex + 1, normalizedTotalPages)} de{' '}
          {normalizedTotalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onFirst}
            disabled={isFirst}
            aria-label="Primeira página"
          >
            <ChevronsLeft aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onPrevious}
            disabled={isFirst}
            aria-label="Página anterior"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onNext}
            disabled={isLast}
            aria-label="Próxima página"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onLast}
            disabled={isLast}
            aria-label="Última página"
          >
            <ChevronsRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

O componente não executa requests diretamente. Ele apenas expressa intenção;
a página controla o índice e o RTK Query atualiza a consulta.

## 14. Composição da página

### Arquivo atualizado: `src/features/patients/pages/patients-page.tsx`

#### Como é hoje

A página lê contexto, dispara efeito manual, monta dois diálogos e usa
paginação fixa:

```tsx
const patients = useContextSelector(
  PatientContext,
  (context) => context.patients,
)

useEffect(() => {
  fetchPatients().then((res) => {
    console.log('Dados da api na page', res.data.content)
  })
}, [])

<Dialog>
  <DialogTrigger asChild>
    <AddPatientModal />
  </DialogTrigger>
  <CreatePatientDialog />
</Dialog>

<Pagination pageIndex={0} totalCount={10} perPage={10} />
```

#### Como deve ficar — arquivo completo

```tsx
import { AlertCircle, UsersRound } from 'lucide-react'
import { useState } from 'react'

import type { PatientFilters } from '@/@types/patient'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useGetServicesQuery } from '@/features/appointments/api/appointments'

import { useGetPatientPageQuery } from '../api/patients'
import { AddPatientModal } from '../components/add-patient-modal'
import { Pagination } from '../components/pagination'
import { PatientTableFilter } from '../components/patient-table-filter'
import PatientTableRows from '../components/patient-table-rows'
import { patientErrorMessage } from '../model/patient-errors'

const PAGE_SIZE = 5
const emptyFilters: PatientFilters = { name: '' }

function PatientTableLoading() {
  return Array.from({ length: PAGE_SIZE }, (_, index) => (
    <TableRow key={index} aria-hidden="true">
      <TableCell colSpan={7} className="p-3">
        <Skeleton className="h-10 w-full" />
      </TableCell>
    </TableRow>
  ))
}

export function Patient() {
  const [pageIndex, setPageIndex] = useState(0)
  const [filters, setFilters] = useState<PatientFilters>(emptyFilters)
  const patientsQuery = useGetPatientPageQuery({
    page: pageIndex,
    size: PAGE_SIZE,
    name: filters.name || undefined,
    status: filters.status,
    serviceId: filters.serviceId,
  })
  const servicesQuery = useGetServicesQuery()

  const response = patientsQuery.data
  const patients = response?.content ?? []
  const totalPages = response?.totalPages ?? 0
  const totalCount = response?.totalElements ?? 0
  const isLast = response?.last ?? true

  function applyFilters(nextFilters: PatientFilters) {
    setFilters(nextFilters)
    setPageIndex(0)
  }

  function clearFilters() {
    setFilters(emptyFilters)
    setPageIndex(0)
  }

  return (
    <main className="min-h-full bg-slate-50/70 px-4 pt-20 pb-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <UsersRound className="size-7" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
              <p className="text-muted-foreground">
                Gerencie o cadastro, histórico e atendimentos dos seus
                pacientes.
              </p>
            </div>
          </div>

          <AddPatientModal />
        </header>

        <PatientTableFilter
          value={filters}
          services={servicesQuery.data ?? []}
          servicesLoading={servicesQuery.isLoading}
          disabled={patientsQuery.isFetching}
          onApply={applyFilters}
          onClear={clearFilters}
        />

        {servicesQuery.isError ? (
          <p className="text-sm text-amber-800" role="status">
            O catálogo de serviços não pôde ser carregado; o filtro de serviço
            está temporariamente indisponível.
          </p>
        ) : null}

        {patientsQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertTitle>Falha ao carregar pacientes</AlertTitle>
            <AlertDescription>
              <p>{patientErrorMessage(patientsQuery.error, 'list')}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => patientsQuery.refetch()}
              >
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-emerald-700 text-white">
              <TableRow className="hover:bg-emerald-700">
                <TableHead className="w-[64px] text-white">
                  <span className="sr-only">Detalhes</span>
                </TableHead>
                <TableHead className="w-[110px] text-white">Código</TableHead>
                <TableHead className="min-w-[230px] text-white">
                  Paciente
                </TableHead>
                <TableHead className="min-w-[190px] text-white">
                  Serviço principal
                </TableHead>
                <TableHead className="min-w-[160px] text-white">
                  Status
                </TableHead>
                <TableHead className="min-w-[170px] text-white">
                  Data de cadastro
                </TableHead>
                <TableHead className="min-w-[250px] text-white">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {patientsQuery.isLoading ? <PatientTableLoading /> : null}

              {!patientsQuery.isLoading && !patientsQuery.isError
                ? patients.map((patient) => (
                    <PatientTableRows patient={patient} key={patient.id} />
                  ))
                : null}

              {!patientsQuery.isLoading &&
              !patientsQuery.isError &&
              patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <p className="font-semibold">Nenhum paciente encontrado</p>
                    <p className="text-muted-foreground text-sm">
                      Ajuste os filtros ou cadastre um novo paciente.
                    </p>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          <Pagination
            pageIndex={response?.page ?? pageIndex}
            totalPages={totalPages}
            totalCount={totalCount}
            isLast={isLast}
            onFirst={() => setPageIndex(0)}
            onPrevious={() =>
              setPageIndex((current) => Math.max(current - 1, 0))
            }
            onNext={() =>
              setPageIndex((current) =>
                Math.min(current + 1, Math.max(totalPages - 1, 0)),
              )
            }
            onLast={() => setPageIndex(Math.max(totalPages - 1, 0))}
          />
        </div>

        {patientsQuery.isFetching && !patientsQuery.isLoading ? (
          <p className="sr-only" role="status" aria-live="polite">
            Atualizando lista de pacientes...
          </p>
        ) : null}
      </section>
    </main>
  )
}
```

#### Comportamento teórico

- a identidade do cache inclui página e filtros;
- aplicar ou limpar filtros sempre volta para a página zero;
- mudar de página preserva os filtros confirmados;
- criar paciente invalida `PatientCatalog/LIST` e atualiza a consulta ativa;
- `isLoading` representa a primeira carga;
- `isFetching` anuncia atualizações posteriores sem desmontar a tabela;
- erro permite retry explícito;
- lista vazia não é tratada como erro;
- a tabela usa os dados do response, não os textos da imagem.

## 15. Remoção do provider global

### Arquivo atualizado: `src/App.tsx`

#### Como é hoje — arquivo completo

```tsx
import { CookiesProvider } from 'react-cookie'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

import { store } from './lib/store'
import { Router } from './Router'

import './globals.css'
import { PatientProvider } from './features/patients/model/patient-context'

export function App() {
  return (
    <CookiesProvider>
      <PatientProvider>
        <BrowserRouter>
          <HelmetProvider>
            <Helmet titleTemplate="%s | Fisioterapia e Pilates" />
            <Toaster richColors />
            <Provider store={store}>
              <Router />
            </Provider>
          </HelmetProvider>
        </BrowserRouter>
      </PatientProvider>
    </CookiesProvider>
  )
}
```

#### Como deve ficar — arquivo completo

```tsx
import { CookiesProvider } from 'react-cookie'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

import { store } from './lib/store'
import { Router } from './Router'

import './globals.css'

export function App() {
  return (
    <CookiesProvider>
      <BrowserRouter>
        <HelmetProvider>
          <Helmet titleTemplate="%s | Fisioterapia e Pilates" />
          <Toaster richColors />
          <Provider store={store}>
            <Router />
          </Provider>
        </HelmetProvider>
      </BrowserRouter>
    </CookiesProvider>
  )
}
```

### Arquivo atualizado: `src/test/render.tsx`

#### Como é hoje

```tsx
import { PatientProvider } from '@/features/patients/model/patient-context'
;<HelmetProvider>
  <PatientProvider>
    <Provider store={store}>{children}</Provider>
  </PatientProvider>
</HelmetProvider>
```

#### Como deve ficar — arquivo completo

```tsx
import { render, type RenderOptions } from '@testing-library/react'
import type { PropsWithChildren, ReactElement } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

import { baseApi } from '@/lib/base-api'
import { createAppStore, type AppStore } from '@/lib/store'

const testStores = new Set<AppStore>()

interface TestRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string
  store?: AppStore
}

export function resetTestApiCache() {
  testStores.forEach((store) => {
    store.dispatch(baseApi.util.resetApiState())
  })
  testStores.clear()
}

export function createTestStore() {
  const store = createAppStore()
  testStores.add(store)
  return store
}

export function renderWithProviders(
  ui: ReactElement,
  options: TestRenderOptions = {},
) {
  const {
    route = '/appointments',
    store = createTestStore(),
    ...renderOptions
  } = options

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <HelmetProvider>
          <Provider store={store}>
            {children}
            <Toaster richColors />
          </Provider>
        </HelmetProvider>
      </MemoryRouter>
    )
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}
```

## 16. Remoção dos fluxos legados

### `src/features/patients/model/patient-context.tsx`

#### Como é hoje

O provider executa:

```tsx
api.get('patient/list')

api.post('patients', {
  uuid,
  name,
  empresa: 'Equilibrio',
  createdAt: new Date(),
  status: 'Ativo',
})
```

#### Como será

O arquivo será removido integralmente. Antes da remoção, confirme:

```bash
rg -n "PatientProvider|PatientContext|fetchPatients|createPatient" src
```

Depois das alterações descritas neste guia, a busca não deve encontrar
consumidores funcionais.

### `src/features/patients/components/create-patient-dialog.tsx`

#### Como é hoje

O segundo diálogo consome `PatientContext.createPatient`, envia apenas nome e
alcança o endpoint inexistente `POST patients`.

#### Como será

O arquivo será removido integralmente. `AddPatientModal` será o único fluxo de
cadastro. Não redirecione o diálogo antigo para a mutation nova, pois manter
dois formulários para a mesma ação recriaria a duplicidade de estado e
validação.

### Verificação após as remoções

```bash
rg -n "patient-context|create-patient-dialog|register-patient" src
rg -n "api\.post\(['\"]patients|POST patients" src
```

As duas buscas devem retornar vazias, com exceção de documentação histórica
que declare explicitamente que o fluxo foi removido.

## 17. Fixtures de teste

### Arquivo novo: `src/test/builders/patient.ts`

#### Intuito

Separar fixtures da listagem de pacientes das opções reduzidas usadas pela
agenda. O campo extra `tenantId` preserva compatibilidade com o catálogo de
pacientes da agenda enquanto a API de pacientes usa `clinicId`.

#### Código completo

```ts
import type { PatientListItem } from '@/@types/patient'

export interface TestPatientListItem extends PatientListItem {
  tenantId: string
}

export const patientListItems: TestPatientListItem[] = [
  {
    id: 'patient-a',
    code: 1,
    name: 'Ana Paciente',
    clinicId: 'tenant-a',
    tenantId: 'tenant-a',
    unitIds: ['unit-a'],
    createdAt: '2025-10-21T12:00:00.000Z',
    status: 'ATIVO',
    principalService: { id: 'service-pilates', name: 'Pilates' },
  },
  {
    id: 'patient-b',
    code: 2,
    name: 'Bia Paciente',
    clinicId: 'tenant-a',
    tenantId: 'tenant-a',
    unitIds: ['unit-a'],
    createdAt: '2025-10-21T12:00:00.000Z',
    status: 'ATIVO',
    principalService: { id: 'service-fisio', name: 'Fisioterapia' },
  },
  {
    id: 'patient-c',
    code: 3,
    name: 'Carla Mendes',
    clinicId: 'tenant-a',
    tenantId: 'tenant-a',
    unitIds: ['unit-a'],
    createdAt: '2025-10-21T12:00:00.000Z',
    status: 'ATIVO',
    principalService: null,
  },
  {
    id: 'patient-d',
    code: 4,
    name: 'Diego Lima',
    clinicId: 'tenant-a',
    tenantId: 'tenant-a',
    unitIds: ['unit-a'],
    createdAt: '2025-10-21T12:00:00.000Z',
    status: 'EM_ATENDIMENTO',
    principalService: null,
  },
  {
    id: 'patient-e',
    code: 5,
    name: 'Elisa Ferreira',
    clinicId: 'tenant-a',
    tenantId: 'tenant-a',
    unitIds: ['unit-a'],
    createdAt: '2025-10-21T12:00:00.000Z',
    status: null,
    principalService: null,
  },
]

export const createdPatient: TestPatientListItem = {
  id: 'patient-created',
  code: 6,
  name: 'Beatriz Souza',
  clinicId: 'tenant-a',
  tenantId: 'tenant-a',
  unitIds: ['unit-a'],
  createdAt: '2026-11-17T12:00:00.000Z',
  status: null,
  principalService: null,
}
```

As fixtures usam `null` em alguns campos para testar a regra mais importante:
a interface deve apresentar ausência, e não fabricar status/serviço.

## 18. Servidor MSW

### Arquivo atualizado: `src/test/server.ts`

#### Como é hoje

- `/auth/me` sempre retorna `adminSession`;
- `GET /patient/list` retorna somente `{ content }` ou array;
- não existe handler de `POST /patient/save`;
- não são registrados filtros nem payloads de paciente;
- o cenário de erro de criação pertence somente a agendamentos.

#### Como deve ficar — arquivo completo

```ts
import { delay, http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import type { PatientListItem } from '@/@types/patient'

import {
  adminSession,
  createdAppointment,
  professionals,
  services,
  units,
  type TestAppointment,
  type TestSession,
} from './builders/appointment'
import {
  createdPatient,
  patientListItems,
  type TestPatientListItem,
} from './builders/patient'

type CatalogName = 'patients' | 'units' | 'services' | 'professionals'

interface ApiScenario {
  session: TestSession
  catalogs: Record<CatalogName, unknown[]>
  catalogDelayMs: number
  catalogErrors: Partial<Record<CatalogName, number>>
  createDelayMs: number
  createErrorCode: string | null
  createNetworkError: boolean
  appointmentDelayMs: number
  appointmentErrorStatus: number | null
  createdAppointment: TestAppointment
  appointments: TestAppointment[]
  createRequests: Record<string, unknown>[]
  professionalQueries: string[]
  appointmentQueries: URLSearchParams[]
  catalogRequests: Record<CatalogName, number>
  collectionResponse: 'content' | 'array'
  patientCreateDelayMs: number
  patientCreateErrorCode: string | null
  patientCreateNetworkError: boolean
  patientCreateRequests: Record<string, unknown>[]
  patientQueries: URLSearchParams[]
  createdPatient: TestPatientListItem
}

function initialScenario(): ApiScenario {
  return {
    session: adminSession,
    catalogs: {
      patients: [...patientListItems],
      units: [...units],
      services: [...services],
      professionals: [...professionals],
    },
    catalogDelayMs: 0,
    catalogErrors: {},
    createDelayMs: 0,
    createErrorCode: null,
    createNetworkError: false,
    appointmentDelayMs: 0,
    appointmentErrorStatus: null,
    createdAppointment,
    appointments: [],
    createRequests: [],
    professionalQueries: [],
    appointmentQueries: [],
    catalogRequests: {
      patients: 0,
      units: 0,
      services: 0,
      professionals: 0,
    },
    collectionResponse: 'content',
    patientCreateDelayMs: 0,
    patientCreateErrorCode: null,
    patientCreateNetworkError: false,
    patientCreateRequests: [],
    patientQueries: [],
    createdPatient,
  }
}

export const apiScenario = initialScenario()

export function resetApiScenario() {
  Object.assign(apiScenario, initialScenario())
}

async function catalogResponse(name: CatalogName, content?: unknown[]) {
  apiScenario.catalogRequests[name] += 1

  if (apiScenario.catalogDelayMs > 0) {
    await delay(apiScenario.catalogDelayMs)
  }

  const errorStatus = apiScenario.catalogErrors[name]
  if (errorStatus) {
    return HttpResponse.json(
      { code: 'CATALOG_LOAD_FAILED', message: `Falha ao carregar ${name}` },
      { status: errorStatus },
    )
  }

  const collection = content ?? apiScenario.catalogs[name]
  return HttpResponse.json(
    apiScenario.collectionResponse === 'array'
      ? collection
      : { content: collection },
  )
}

async function patientListResponse(request: Request) {
  apiScenario.catalogRequests.patients += 1
  apiScenario.patientQueries.push(new URL(request.url).searchParams)

  if (apiScenario.catalogDelayMs > 0) {
    await delay(apiScenario.catalogDelayMs)
  }

  const errorStatus = apiScenario.catalogErrors.patients
  if (errorStatus) {
    return HttpResponse.json(
      {
        code: 'PATIENT_LIST_FAILED',
        message: 'Falha ao carregar pacientes',
      },
      { status: errorStatus },
    )
  }

  const searchParams = new URL(request.url).searchParams
  const page = Math.max(Number(searchParams.get('page') ?? 0), 0)
  const size = Math.max(Number(searchParams.get('size') ?? 5), 1)
  const name = searchParams.get('name')?.trim().toLocaleLowerCase('pt-BR')
  const status = searchParams.get('status')
  const serviceId = searchParams.get('serviceId')
  const allPatients = apiScenario.catalogs.patients as PatientListItem[]
  const filtered = allPatients.filter((patient) => {
    const matchesName =
      !name || patient.name.toLocaleLowerCase('pt-BR').includes(name)
    const matchesStatus = !status || patient.status === status
    const matchesService =
      !serviceId || patient.principalService?.id === serviceId

    return matchesName && matchesStatus && matchesService
  })

  if (apiScenario.collectionResponse === 'array') {
    return HttpResponse.json(filtered)
  }

  const start = page * size
  const content = filtered.slice(start, start + size)
  const totalPages = Math.ceil(filtered.length / size)

  return HttpResponse.json({
    content,
    page,
    size,
    totalElements: filtered.length,
    totalPages,
    last: totalPages === 0 || page >= totalPages - 1,
  })
}

function patientErrorStatus(code: string) {
  switch (code) {
    case 'VALIDATION_ERROR':
      return 400
    case 'CLINIC_ACCESS_DENIED':
    case 'UNIT_ACCESS_DENIED':
      return 403
    case 'TENANT_RESOURCE_NOT_FOUND':
      return 404
    default:
      return 409
  }
}

const handlers = [
  http.get('http://localhost:8080/auth/me', () => {
    const session = apiScenario.session

    return HttpResponse.json({
      id: session.user.id,
      name: session.user.name,
      login: 'user@clinica.test',
      role: session.user.role,
      tenantId: session.tenantId,
      activeUnitId: session.activeUnitId,
      clinicName: 'Equilíbrio',
      unitName: 'Matriz',
    })
  }),
  http.get('http://localhost:8080/patient/list', ({ request }) =>
    patientListResponse(request),
  ),
  http.post('http://localhost:8080/patient/save', async ({ request }) => {
    const payload = (await request.json()) as Record<string, unknown>
    apiScenario.patientCreateRequests.push(payload)

    if (apiScenario.patientCreateDelayMs > 0) {
      await delay(apiScenario.patientCreateDelayMs)
    }

    if (apiScenario.patientCreateNetworkError) {
      return HttpResponse.error()
    }

    if (apiScenario.patientCreateErrorCode) {
      return HttpResponse.json(
        {
          code: apiScenario.patientCreateErrorCode,
          message: 'Cadastro recusado pelo domínio',
          fieldErrors: {},
        },
        { status: patientErrorStatus(apiScenario.patientCreateErrorCode) },
      )
    }

    const response: TestPatientListItem = {
      ...apiScenario.createdPatient,
      name: String(payload.name),
      unitIds: Array.isArray(payload.unitIds)
        ? payload.unitIds.map(String)
        : [],
    }
    apiScenario.catalogs.patients.push(response)
    return HttpResponse.json(response, { status: 201 })
  }),
  http.get('http://localhost:8080/api/units', () => catalogResponse('units')),
  http.get('http://localhost:8080/api/services', () =>
    catalogResponse('services'),
  ),
  http.get('http://localhost:8080/api/professionals', ({ request }) => {
    const serviceId = new URL(request.url).searchParams.get('serviceId') ?? ''
    apiScenario.professionalQueries.push(serviceId)
    const matchingProfessionals = apiScenario.catalogs.professionals.filter(
      (professional) => {
        const serviceIds = (professional as { serviceIds?: string[] })
          .serviceIds
        return !serviceId || serviceIds?.includes(serviceId)
      },
    )
    return catalogResponse('professionals', matchingProfessionals)
  }),
  http.get('http://localhost:8080/api/appointments', async ({ request }) => {
    apiScenario.appointmentQueries.push(new URL(request.url).searchParams)
    if (apiScenario.appointmentDelayMs > 0) {
      await delay(apiScenario.appointmentDelayMs)
    }
    if (apiScenario.appointmentErrorStatus) {
      return HttpResponse.json(
        {
          code: 'APPOINTMENT_LOAD_FAILED',
          message: 'Falha ao carregar agenda',
        },
        { status: apiScenario.appointmentErrorStatus },
      )
    }
    return HttpResponse.json(
      apiScenario.collectionResponse === 'array'
        ? apiScenario.appointments
        : { content: apiScenario.appointments },
    )
  }),
  http.post('http://localhost:8080/api/appointments', async ({ request }) => {
    const payload = (await request.json()) as Record<string, unknown>
    apiScenario.createRequests.push(payload)

    if (apiScenario.createDelayMs > 0) {
      await delay(apiScenario.createDelayMs)
    }

    if (apiScenario.createNetworkError) {
      return HttpResponse.error()
    }

    if (apiScenario.createErrorCode) {
      return HttpResponse.json(
        {
          code: apiScenario.createErrorCode,
          message: 'Criação recusada pelo domínio',
          fieldErrors: {},
        },
        {
          status:
            apiScenario.createErrorCode === 'TENANT_RESOURCE_NOT_FOUND'
              ? 404
              : 409,
        },
      )
    }

    apiScenario.appointments.push(apiScenario.createdAppointment)
    return HttpResponse.json(apiScenario.createdAppointment, { status: 201 })
  }),
]

export const server = setupServer(...handlers)
```

#### Por que manter os handlers da agenda

`server.ts` é compartilhado pela suíte inteira. A atualização deve acrescentar
o domínio de pacientes sem remover os cenários de agendamento existentes.

## 19. Testes de criação

### Arquivo atualizado: `src/features/patients/__tests__/patient-create.integration.test.tsx`

#### Como é hoje

O único teste confirma o comportamento incorreto:

```tsx
expect(body).toEqual({ name: 'Beatriz' })
```

Ele não fornece sessão/unidade, não testa papéis e cria handler local em vez de
usar o cenário compartilhado.

#### Como deve ficar — arquivo completo

```tsx
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { adminSession, basicSession } from '@/test/builders/appointment'
import { renderWithProviders } from '@/test/render'
import { apiScenario } from '@/test/server'

import { AddPatientModal } from '../components/add-patient-modal'

describe('cadastro de pacientes', () => {
  it('deriva a unidade ativa ao cadastrar como BASIC', async () => {
    apiScenario.session = basicSession
    const user = userEvent.setup()
    renderWithProviders(<AddPatientModal />)

    await user.click(screen.getByRole('button', { name: /novo paciente/i }))
    expect(await screen.findByText('Unidade Centro')).toBeVisible()

    await user.type(
      screen.getByRole('textbox', { name: 'Paciente' }),
      'Beatriz',
    )
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(apiScenario.patientCreateRequests).toContainEqual({
        name: 'Beatriz',
        unitIds: ['unit-a'],
      }),
    )
  })

  it('envia as unidades explicitamente selecionadas pelo ADMIN', async () => {
    apiScenario.session = adminSession
    apiScenario.catalogs.units.push({
      id: 'unit-b',
      name: 'Unidade Norte',
      tenantId: 'tenant-a',
      timeZone: 'America/Cuiaba',
    })
    const user = userEvent.setup()
    renderWithProviders(<AddPatientModal />)

    await user.click(screen.getByRole('button', { name: /novo paciente/i }))
    await user.click(
      await screen.findByRole('checkbox', { name: 'Unidade Centro' }),
    )
    await user.click(screen.getByRole('checkbox', { name: 'Unidade Norte' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Paciente' }),
      'Beatriz',
    )
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(apiScenario.patientCreateRequests).toContainEqual({
        name: 'Beatriz',
        unitIds: ['unit-a', 'unit-b'],
      }),
    )
  })

  it('preserva o formulário e informa nome duplicado', async () => {
    apiScenario.session = basicSession
    apiScenario.patientCreateErrorCode = 'PATIENT_ALREADY_EXISTS'
    const user = userEvent.setup()
    renderWithProviders(<AddPatientModal />)

    await user.click(screen.getByRole('button', { name: /novo paciente/i }))
    await screen.findByText('Unidade Centro')
    const nameInput = screen.getByRole('textbox', { name: 'Paciente' })
    await user.type(nameInput, 'Ana Paciente')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(
      await screen.findByText('Já existe um paciente com esse nome.'),
    ).toBeVisible()
    expect(nameInput).toHaveValue('Ana Paciente')
  })

  it('bloqueia BASIC quando a unidade ativa não pertence ao catálogo', async () => {
    apiScenario.session = {
      ...basicSession,
      activeUnitId: 'unit-outside-catalog',
    }
    const user = userEvent.setup()
    renderWithProviders(<AddPatientModal />)

    await user.click(screen.getByRole('button', { name: /novo paciente/i }))

    expect(
      await screen.findByText(
        'A unidade ativa da sessão não está disponível no catálogo.',
      ),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()
  })
})
```

### Casos adicionais recomendados

Depois dos quatro casos obrigatórios, adicionar testes parametrizados para
`CLINIC_ACCESS_DENIED`, `UNIT_ACCESS_DENIED`,
`TENANT_RESOURCE_NOT_FOUND`, `VALIDATION_ERROR` e falha de rede. Eles devem
validar a mensagem e confirmar que o diálogo permanece aberto.

## 20. Testes da página

### Arquivo atualizado: `src/features/patients/__tests__/patients-page.integration.test.tsx`

#### Como é hoje

O teste confirma apenas dois nomes e verifica que o filtro repete a requisição,
sem confirmar parâmetros:

```tsx
expect(apiScenario.catalogRequests.patients).toBe(initialRequests + 1)
```

#### Como deve ficar — arquivo completo

```tsx
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { createdPatient } from '@/test/builders/patient'
import { renderWithProviders } from '@/test/render'
import { apiScenario } from '@/test/server'

import { Patient } from '../pages/patients-page'

describe('feature de pacientes', () => {
  it('apresenta os valores reais retornados pela API', async () => {
    renderWithProviders(<Patient />, { route: '/paciente' })

    expect(await screen.findByText('Ana Paciente')).toBeVisible()
    expect(screen.getByText('0001')).toBeVisible()
    expect(screen.getByText('Pilates')).toBeVisible()
    expect(screen.getAllByText('Ativo').length).toBeGreaterThan(0)
    expect(screen.getAllByText('21/10/2025').length).toBeGreaterThan(0)
    expect(screen.getByText('Total de 5 item(s)')).toBeVisible()
  })

  it('envia o nome confirmado e volta para a primeira página', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Patient />, { route: '/paciente' })
    await screen.findByText('Ana Paciente')

    await user.type(screen.getByPlaceholderText('Nome do paciente...'), 'Ana')
    await user.click(screen.getByRole('button', { name: 'Filtrar' }))

    await waitFor(() => {
      const lastQuery = apiScenario.patientQueries.at(-1)
      expect(lastQuery?.get('name')).toBe('Ana')
      expect(lastQuery?.get('page')).toBe('0')
    })
    expect(screen.getByText('Ana Paciente')).toBeVisible()
    expect(screen.queryByText('Bia Paciente')).not.toBeInTheDocument()
  })

  it('usa os metadados da API para navegar entre páginas', async () => {
    apiScenario.catalogs.patients.push({
      ...createdPatient,
      id: 'patient-f',
      code: 6,
      name: 'Fernanda Lopes',
    })
    const user = userEvent.setup()
    renderWithProviders(<Patient />, { route: '/paciente' })
    await screen.findByText('Ana Paciente')

    expect(screen.getByText('Página 1 de 2')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Próxima página' }))

    expect(await screen.findByText('Fernanda Lopes')).toBeVisible()
    await waitFor(() =>
      expect(apiScenario.patientQueries.at(-1)?.get('page')).toBe('1'),
    )
    expect(screen.getByText('Página 2 de 2')).toBeVisible()
  })

  it('apresenta estado vazio sem inventar linhas', async () => {
    apiScenario.catalogs.patients = []
    renderWithProviders(<Patient />, { route: '/paciente' })

    expect(await screen.findByText('Nenhum paciente encontrado')).toBeVisible()
    expect(screen.getByText('Total de 0 item(s)')).toBeVisible()
  })

  it('permite tentar novamente depois de uma falha', async () => {
    apiScenario.catalogErrors.patients = 500
    const user = userEvent.setup()
    renderWithProviders(<Patient />, { route: '/paciente' })

    expect(await screen.findByText('Falha ao carregar pacientes')).toBeVisible()

    delete apiScenario.catalogErrors.patients
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByText('Ana Paciente')).toBeVisible()
  })
})
```

### Testes unitários opcionais de alto valor

Se os helpers `initials`, `formatCode` e `formatDate` forem movidos para um
arquivo de model, cobrir:

- nome com um termo;
- nome com espaços extras;
- código menor que quatro dígitos;
- data inválida;
- `status = null`;
- `principalService = null`.

Não é necessário exportar helpers privados apenas para testar detalhes de
implementação; os testes de integração já cobrem a saída visível.

## 21. Documentação do frontend

### Arquivo atualizado: `src/features/patients/README.md`

#### Como é hoje

O README afirma que existem dois fluxos de criação, contexto legado, filtro
sem efeito e lacunas preservadas.

#### Como deve ficar — arquivo completo

````md
# Feature `patients`

## Objetivo

Concentrar a listagem paginada, filtros remotos, cadastro e apresentação de
pacientes. A rota pública da feature permanece `/paciente`.

## Estrutura

```text
patients/
├── api/
│   └── patients.ts
├── components/
│   ├── add-patient-modal.tsx
│   ├── pagination.tsx
│   ├── patient-status-badge.tsx
│   ├── patient-table-filter.tsx
│   └── patient-table-rows.tsx
├── model/
│   └── patient-errors.ts
├── pages/
│   └── patients-page.tsx
├── __tests__/
│   ├── patient-create.integration.test.tsx
│   └── patients-page.integration.test.tsx
└── README.md
```

## Fluxos

- listagem → `GET /patient/list` via RTK Query;
- filtros/paginação → parâmetros `name`, `status`, `serviceId`, `page`, `size`;
- cadastro → `POST /patient/save` com `name` e `unitIds`;
- sucesso de cadastro → invalidação de `PatientCatalog/LIST`;
- sessão/unidades/serviços → hooks de catálogo compartilhados com agenda.

## Regras de vínculo

- a clínica é derivada e autorizada pelo backend;
- `BASIC` usa exclusivamente `activeUnitId` da sessão;
- `ADMIN` escolhe uma ou mais unidades do catálogo autorizado;
- controles do frontend não substituem autorização do backend.

## Ausência de dados

`status` e `principalService` podem ser nulos enquanto o backend não tiver uma
fonte de domínio confiável. A tela apresenta `—` e nunca usa valores fixos.

## Limites atuais

Detalhe, edição e desativação permanecem desabilitados até existirem contratos
HTTP, autorização e testes próprios.
````

### Arquivo atualizado: `src/@types/README.md`

#### Como é hoje

```md
| `CreatePatient*`, `PatientContext*`, `PaginationProps` | `patient.ts` | Usados pela API, contexto, página e componentes de pacientes |
```

#### Como deve ficar

```md
| `PatientList*`, `PatientFilters`, `CreatePatient*`, `PaginationProps` | `patient.ts` | Contratos da API, página, filtros, cadastro e paginação de pacientes |
```

Substituir também a seção de lacunas:

```md
## Lacunas

Os contratos de pacientes estão consolidados em RTK Query e não expõem mais
tipos de contexto/Axios. `status` e `principalService` permanecem anuláveis até
que o backend possua fonte de domínio confiável. Contratos futuros de edição,
desativação e detalhe devem ser adicionados apenas com seus fluxos reais.
```

### Arquivo atualizado: `src/context/README.md`

#### Como é hoje

O documento diz que `PatientContext` permanece ativo e que `App` monta seu
provider.

#### Como deve ficar — arquivo completo

```md
# Contextos compartilhados

## Objetivo do módulo

Compartilhar somente estado de interface realmente transversal, sem armazenar
coleções remotas de domínio.

## Estado atual

- pacientes usam RTK Query dentro de `features/patients`;
- `App.tsx` não monta mais `PatientProvider`;
- `useGlobalContext.tsx` permanece como esqueleto legado de autenticação e deve
  ser concluído ou removido em change própria.

## Regras

- dados remotos de pacientes, profissionais, serviços e agendamentos pertencem
  aos adaptadores de API/cache;
- contexto não executa comandos de criação de domínio;
- contexto pode guardar estado visual transversal, como unidade ativa ou data,
  quando esse estado não for derivável da sessão/query;
- autorização e escopo de clínica/unidade continuam no backend.
```

### Arquivo atualizado: `src/api/README.md`

#### Como é hoje

```md
- `features/patients/api/register-patient.ts`: adaptador de paciente migrado;
```

#### Como deve ficar

```md
- `features/patients/api/patients.ts`: listagem paginada e cadastro de pacientes via RTK Query;
```

Atualizar também a observação sobre endpoints alternados:

```md
- o fluxo de pacientes foi consolidado em `GET /patient/list` e
  `POST /patient/save`; o endpoint legado `POST patients` foi removido do
  frontend;
```

### Arquivo atualizado: `src/features/README.md`

#### Como é hoje

```md
| `patients` | Em migração | `src/features/patients` | Migrar página, componentes, contexto, API, testes e documentação |
```

#### Como deve ficar

```md
| `patients` | Implementado no escopo atual | `src/features/patients` | Listagem, filtros, paginação e cadastro com vínculo de unidades |
```

Substituir o parágrafo que afirma que os dois fluxos legados permanecem por:

```md
A feature de pacientes usa uma única integração RTK Query. O contexto remoto e
o endpoint legado `POST patients` foram removidos. Edição, detalhe e
desativação continuam planejados para changes específicas.
```

## 22. Dependências de backend incorporadas neste guia

Este documento não contém a implementação Java, mas já reflete as últimas
correções que deverão aparecer no guia do backend:

1. `validateClinicId` **não existe no código atual**. Ele será um método
   privado novo de `PatientService`, chamado antes de persistir, para rejeitar
   `clinicId` legado divergente da clínica autenticada. O frontend não chama e
   não reproduz essa validação.
2. `PrincipalServiceResponse` **não existe no código atual**. Ele será um novo
   record de response com `UUID id` e `String name`.
3. `PatientResponseDTO` deverá expor `code`, `createdAt`, `status` e
   `principalService`, além dos campos atuais.
4. A interface completa de `PatientMapper` deverá manter um `toDto(Patient)`
   seguro, que delega para a sobrecarga com `status` e
   `PrincipalServiceResponse` nulos, e outra sobrecarga que recebe esses dados
   já resolvidos pelo service.
5. O mapper não deve consultar serviços nem inferir o serviço principal. Sem
   fonte confiável, o JSON devolve `principalService: null`, e este frontend
   apresenta `—`.

Essas decisões explicam por que os tipos do frontend usam campos anuláveis e
por que a linha da tabela não possui fallback fictício.

## 23. Aplicação visual da referência

A imagem é uma referência de hierarquia e densidade, não uma fonte de dados.
O código proposto aplica:

| Elemento       | Tratamento                                             |
| -------------- | ------------------------------------------------------ |
| título         | ícone verde, título forte e descrição curta            |
| ação principal | botão verde `Novo Paciente`                            |
| filtros        | controles grandes, alinhados e responsivos             |
| card da tabela | fundo branco, borda, sombra leve e cantos arredondados |
| cabeçalho      | verde escuro com texto branco                          |
| linhas         | alternância branca/verde muito claro                   |
| paciente       | iniciais em círculo e nome em destaque                 |
| status         | texto + ícone + cor sem depender apenas da cor         |
| ausência       | caractere `—`, nunca valor inventado                   |
| paginação      | total, página corrente e quatro ações com limites      |

Não modificar nesta change o sidebar, topbar, roteamento geral ou identidade
visual de outras páginas. A modernização deve ficar contida na feature de
pacientes e reutilizar os componentes-base existentes.

### Responsividade

- cabeçalho empilha em telas pequenas;
- filtros usam grid e quebram antes de comprimir textos;
- a tabela mantém rolagem horizontal pelo componente `Table` existente;
- os botões conservam nomes acessíveis;
- nenhum conteúdo depende de hover para ser descoberto.

### Acessibilidade

Verificar manualmente:

- navegação completa por teclado;
- foco visível em botão, input, select e checkbox;
- associação de `Paciente` ao input;
- nome acessível em selects e botões de paginação;
- anúncio de carregamento e atualização;
- erro com `role="alert"`;
- contraste dos verdes, amarelo e cinza;
- ícones decorativos com `aria-hidden="true"`.

## 24. Matriz de rastreabilidade

| Requisito                    | Código                                  | Teste                                        |
| ---------------------------- | --------------------------------------- | -------------------------------------------- |
| listar pacientes da API      | `patients.ts`, `patients-page.tsx`      | apresenta valores reais                      |
| paginação real               | `PatientListResponse`, `pagination.tsx` | navega entre páginas                         |
| filtro por nome              | `patient-table-filter.tsx`              | confirma query `name`                        |
| filtros status/serviço       | filtro + query RTK                      | adicionar asserts de parâmetros após backend |
| cadastrar `BASIC`            | `add-patient-modal.tsx`                 | deriva `activeUnitId`                        |
| cadastrar `ADMIN`            | seleção de checkboxes                   | envia unidades selecionadas                  |
| impedir unidade inválida     | validação de catálogo                   | bloqueia unidade fora do catálogo            |
| atualizar lista após criação | invalidação `PatientCatalog/LIST`       | teste integrado recomendado                  |
| exibir ausência honesta      | row + status badge                      | fixtures com campos nulos                    |
| erro recuperável             | parser + alert/refetch                  | retry da listagem                            |
| remover endpoint legado      | exclusão de contexto/dialog             | buscas `rg` sem ocorrências                  |

## 25. Verificações obrigatórias

### 25.1 Antes de implementar

```bash
git status --short
codegraph status
openspec status --change modernizar-listagem-e-vincular-pacientes
```

Preservar alterações preexistentes. Não remover arquivos até que os novos
imports estejam prontos.

### 25.2 Durante a implementação

Após tipos e adaptador:

```bash
npm run build
```

Após componentes e página:

```bash
npm run lint
npm run build
```

Após MSW e testes:

```bash
npm test -- src/features/patients/__tests__/patient-create.integration.test.tsx
npm test -- src/features/patients/__tests__/patients-page.integration.test.tsx
npm test
```

O teste completo é obrigatório porque `GET /patient/list` também alimenta o
catálogo da agenda. As fixtures deste guia preservam `Ana Paciente` e
`Bia Paciente` para não quebrar as expectativas já existentes dessa feature.

### 25.3 Buscas de resíduos legados

```bash
rg -n "PatientProvider|PatientContext|fetchPatients|createPatient" src
rg -n "patient-context|create-patient-dialog|register-patient" src
rg -n "api\.post\(['\"]patients|POST patients" src
rg -n "console\.(log|debug).*patient|setTimeout\(.*2000" src/features/patients
```

Não pode restar consumidor executável do contexto, diálogo ou endpoint legado.

### 25.4 Validação final da change

```bash
npm run lint
npm run build
npm test
openspec validate modernizar-listagem-e-vincular-pacientes --strict
git diff --check
```

Se status/serviço ainda não estiverem filtráveis no backend, a validação final
deve ocorrer com esses controles retirados ou explicitamente desabilitados e
acompanhados de texto que não prometa comportamento inexistente.

## 26. Checklist de aceite do frontend

- [ ] `/paciente` faz `GET /patient/list` via RTK Query;
- [ ] a tabela usa `code`, `name`, `createdAt`, `status` e
      `principalService` do response;
- [ ] campos ausentes mostram `—`;
- [ ] filtros enviados aparecem na URL da requisição;
- [ ] mudança de filtro volta para página zero;
- [ ] paginação usa `page`, `totalElements`, `totalPages` e `last` reais;
- [ ] carregamento inicial mostra skeleton;
- [ ] atualização posterior é anunciada sem apagar a tabela;
- [ ] erro oferece nova tentativa;
- [ ] lista vazia possui mensagem própria;
- [ ] `BASIC` envia exatamente `[activeUnitId]`;
- [ ] `BASIC` não consegue selecionar outra unidade;
- [ ] `ADMIN` seleciona somente unidades do catálogo;
- [ ] criação envia `{ name, unitIds }`, sem `clinicId`;
- [ ] sucesso invalida a lista e fecha/resetar o modal;
- [ ] erro mantém os dados no modal;
- [ ] não existe espera artificial de dois segundos;
- [ ] não existem logs de dados do paciente;
- [ ] `PatientContext`, `PatientProvider` e o diálogo legado foram removidos;
- [ ] não existe chamada `POST patients`;
- [ ] editar, detalhe e desativar continuam desabilitados;
- [ ] testes da feature, suíte completa, lint e build passam;
- [ ] documentação da feature e módulos transversais foi atualizada;
- [ ] `openspec validate ... --strict` passa.

## 27. Resultado esperado

Ao concluir este guia, a tela terá uma arquitetura única:

```text
/paciente
  └── Patient
      ├── useGetPatientPageQuery
      │   └── GET /patient/list?page&size&name&status&serviceId
      ├── PatientTableFilter
      ├── PatientTableRows
      ├── Pagination
      └── AddPatientModal
          ├── useGetAppointmentSessionQuery
          ├── useGetUnitsQuery
          └── useRegisterPatientMutation
              └── POST /patient/save { name, unitIds }
```

Não haverá contexto remoto paralelo, endpoint alternativo nem valores visuais
fixos. A clínica continuará sendo uma decisão segura do backend, enquanto o
frontend oferecerá seleção coerente de unidade e feedback completo para a
pessoa usuária.
