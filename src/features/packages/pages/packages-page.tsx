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
import { DataTableCard } from '@/components/data-table-shell'
import { PageContainer, PageHeader } from '@/components/page-shell'

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
  const [detailOpen, setDetailOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const detailReturnFocus = useRef<HTMLElement | null>(null)
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
    setDetailOpen(false)
  }

  function clearFilters() {
    setFilters({})
    setPage(0)
    setSelectedId(null)
    setDetailOpen(false)
  }

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
    <PageContainer>
      <PageHeader
        title="Pacotes de serviços"
        description="Consulte, compare e configure sessões, dias e valores por unidade."
        actions={
          <Button type="button" onClick={openCreateModal}>
            Novo pacote
          </Button>
        }
      />

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

        <DataTableCard
          ariaLabel="Lista de pacotes"
          footer={
            <PackagePagination
              page={packages.data?.page ?? page}
              totalPages={packages.data?.totalPages ?? 0}
              totalElements={packages.data?.totalElements ?? 0}
              last={packages.data?.last ?? true}
              disabled={packages.isFetching}
              onPageChange={(nextPage) => setPage(Math.max(nextPage, 0))}
            />
          }
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
        </DataTableCard>

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
    </PageContainer>
  )
}
