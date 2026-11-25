import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from 'react'
import { toast } from 'sonner'

import {
  useGetAppointmentSessionQuery,
  useGetServicesQuery,
  useGetUnitsQuery,
} from '@/features/appointments/api/appointments'
import { Button } from '@/components/ui/button'

import {
  type ServicePackage,
  type ServicePackageFilters,
  useCreateServicePackageMutation,
  useGetServicePackageQuery,
  useGetServicePackagesQuery,
  useUpdateServicePackageMutation,
  useUpdateServicePackageStatusMutation,
} from '../api/packages'
import { PackageDetailPanel } from '../components/package-detail-panel'
import { PackageFormModal } from '../components/package-form-modal'
import { PackagePagination } from '../components/package-pagination'
import { PackageTable } from '../components/package-table'
import { PackageTableFilter } from '../components/package-table-filter'
import {
  toServicePackageInput,
  type PackageFormValues,
} from '../model/package-form-schema'

const PAGE_SIZE = 10

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

function messageFrom(error: unknown) {
  const data = (error as { data?: { message?: string } })?.data
  return (
    data?.message ??
    'Não foi possível salvar o pacote. Revise os dados e tente novamente.'
  )
}

export function PackagesPage() {
  const sessionQuery = useGetAppointmentSessionQuery()
  const session = sessionQuery.data
  const units = useGetUnitsQuery()
  const services = useGetServicesQuery()
  const isAdmin = session?.user.role === 'ADMIN'
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
  const [createPackage, createState] = useCreateServicePackageMutation()
  const [updatePackage, updateState] = useUpdateServicePackageMutation()
  const [changeStatus, changeStatusState] =
    useUpdateServicePackageStatusMutation()

  const items = packages.data?.content ?? []
  const selectedListItem = items.find((item) => item.id === selectedId) ?? null
  const selectedItem = selectedId
    ? detailQuery.data ?? selectedListItem
    : null
  const editingItem = editingId
    ? detailQuery.data ?? items.find((item) => item.id === editingId) ?? null
    : null
  const editingInitialValues = useMemo(
    () => (editingItem ? formFromPackage(editingItem) : undefined),
    [editingItem],
  )
  const catalogsLoading = units.isLoading || services.isLoading
  const isSaving = createState.isLoading || updateState.isLoading

  useEffect(() => {
    if (
      selectedId &&
      packages.data &&
      !items.some((item) => item.id === selectedId)
    ) {
      setSelectedId(null)
    }
  }, [items, packages.data, selectedId])

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

  function handleModalOpenChange(open: boolean) {
    setModalOpen(open)
    if (!open) {
      setEditingId(null)
      requestAnimationFrame(() => modalReturnFocus.current?.focus())
    }
  }

  async function submit(values: PackageFormValues) {
    try {
      const active = editingItem?.active ?? true
      const data = toServicePackageInput(values, active)

      if (editingId) {
        await updatePackage({ id: editingId, data }).unwrap()
        toast.success('Pacote atualizado com sucesso.')
      } else {
        await createPackage(data).unwrap()
        toast.success('Pacote criado com sucesso.')
      }

      handleModalOpenChange(false)
    } catch (error) {
      toast.error(messageFrom(error))
    }
  }

  async function toggleStatus(item: ServicePackage) {
    try {
      await changeStatus({ id: item.id, active: !item.active }).unwrap()
      toast.success(item.active ? 'Pacote desativado.' : 'Pacote ativado.')
    } catch (error) {
      toast.error(messageFrom(error))
    }
  }

  if (sessionQuery.isLoading) {
    return (
      <main className="p-6" role="status">
        Carregando permissões...
      </main>
    )
  }

  if (sessionQuery.isError || !session) {
    return (
      <main className="p-6" role="alert">
        Não foi possível identificar sua sessão.
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">Pacotes</h1>
        <p className="mt-3">Somente administradores podem gerenciar pacotes.</p>
      </main>
    )
  }

  return (
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

        <PackageTableFilter
          value={filters}
          units={units.data ?? []}
          services={services.data ?? []}
          disabled={packages.isFetching}
          catalogsLoading={catalogsLoading}
          onApply={applyFilters}
          onClear={clearFilters}
        />

        {packages.isError ? (
          <p role="alert">
            Não foi possível carregar os pacotes.{' '}
            <Button
              type="button"
              variant="link"
              onClick={() => packages.refetch()}
            >
              Tentar novamente
            </Button>
          </p>
        ) : null}

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

        <PackageFormModal
          open={modalOpen}
          isEditing={Boolean(editingId)}
          initialValues={editingInitialValues}
          units={units.data ?? []}
          services={services.data ?? []}
          catalogsLoading={catalogsLoading}
          isSaving={isSaving}
          detailLoading={Boolean(editingId && detailQuery.isLoading)}
          onOpenChange={handleModalOpenChange}
          onSubmit={(values) => void submit(values)}
        />
      </section>
    </main>
  )
}
