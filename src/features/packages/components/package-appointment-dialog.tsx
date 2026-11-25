import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { AppointmentSession } from '@/@types/appointment'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  useGetAppointmentPatientsQuery,
  useGetProfessionalsQuery,
  useGetUnitsQuery,
} from '@/features/appointments/api/appointments'

import {
  useConfirmPackageAppointmentMutation,
  usePreviewPackageAppointmentMutation,
} from '../api/package-appointments'
import {
  useGetServicePackagesQuery,
  type PackageWeekDay,
} from '../api/packages'

const days: {
    value: PackageWeekDay; label: string }[] = [
    { value: 'MONDAY', label: 'Segunda' },
    { value: 'TUESDAY', label: 'Terça' },
    { value: 'WEDNESDAY', label: 'Quarta' },
    { value: 'THURSDAY', label: 'Quinta' },
    { value: 'FRIDAY', label: 'Sexta' },
    { value: 'SATURDAY', label: 'Sábado' },
    { value: 'SUNDAY', label: 'Domingo' },
]

const controlClassName =
  'h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-black disabled:bg-gray-100'

interface PackageAppointmentDialogProps {
  session: AppointmentSession
  defaultDate?: string
}

export function PackageAppointmentDialog({
  session,
  defaultDate,
}: PackageAppointmentDialogProps) {
  const [open, setOpen] = useState(false)
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
  const patientsQuery = useGetAppointmentPatientsQuery(effectiveUnitId, {
    skip: !open || !effectiveUnitId,
  })
  const packagesQuery = useGetServicePackagesQuery(
    {
      active: true,
      unitId: effectiveUnitId || undefined,
      page: 0,
      size: 100,
    },
    { skip: !open || !effectiveUnitId },
  )
  const packageItems = packagesQuery.data?.content ?? []
  const selectedPackage = packageItems.find(
    (item) => item.id === packageId,
  )
  const professionalsQuery = useGetProfessionalsQuery(
    selectedPackage?.serviceId ?? '',
    { skip: !open || !selectedPackage },
  )
  const [preview, previewState] = usePreviewPackageAppointmentMutation()
  const [confirm, confirmState] = useConfirmPackageAppointmentMutation()

  const unitOptions = unitsQuery.data ?? []
  const availablePatients = patientsQuery.data ?? []
  const availablePackages = useMemo(
    () =>
      packageItems.filter(
        (item) => item.active && item.unitId === effectiveUnitId,
      ) ?? [],
    [effectiveUnitId, packageItems],
  )
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

  const isLoading =
    unitsQuery.isLoading ||
    patientsQuery.isLoading ||
    packagesQuery.isLoading
  const catalogsError =
    unitsQuery.isError || patientsQuery.isError || packagesQuery.isError

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label="Agendamento de Pacotes"
        >
          Agendamento de Pacotes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agendamento de Pacotes</DialogTitle>
          <DialogDescription>
            Este fluxo usa os mesmos dados de horário do agendamento manual. Os
            dias podem ser ajustados apenas para esta contratação.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
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

          <label>
            Paciente
            <select
              aria-label="Paciente"
              className={controlClassName}
              value={patientId}
              onChange={(event) => changePatient(event.target.value)}
              disabled={!hasUnit || patientsQuery.isLoading}
            >
              <option value="">
                {hasUnit
                  ? 'Selecione o paciente'
                  : 'Selecione a unidade primeiro'}
              </option>
              {availablePatients.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          {hasUnit && patientsQuery.isSuccess && availablePatients.length === 0 ? (
            <p>Nenhum paciente disponível para esta unidade.</p>
          ) : null}

          <label>
            Pacote
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
          </label>

          {hasUnit && packagesQuery.isSuccess && availablePackages.length === 0 ? (
            <p>Nenhum pacote disponível para esta unidade.</p>
          ) : null}

          <label>
            Data inicial
            <input
              aria-label="Data inicial"
              className={controlClassName}
              type="date"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value)
                resetPreview()
              }}
            />
          </label>

          <label>
            Horário
            <input
              aria-label="Horário"
              className={controlClassName}
              type="time"
              value={time}
              onChange={(event) => {
                setTime(event.target.value)
                resetPreview()
              }}
            />
          </label>

          <label>
            Profissional (opcional)
            <select
              aria-label="Profissional (opcional)"
              className={controlClassName}
              value={professionalId}
              onChange={(event) => {
                setProfessionalId(event.target.value)
                resetPreview()
              }}
              disabled={!selectedPackage || professionalsQuery.isLoading}
            >
              <option value="">Sem profissional</option>
              {professionalsQuery.data?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend>Dias efetivos</legend>
            <div className="flex flex-wrap gap-2">
              {days.map((day) => (
                <label key={day.value} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={effectiveWeekDays.includes(day.value)}
                    onChange={(event) => {
                      setEffectiveWeekDays((current) =>
                        event.target.checked
                          ? [...current, day.value]
                          : current.filter((value) => value !== day.value),
                      )
                      resetPreview()
                    }}
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </fieldset>

          {isLoading ? <p role="status">Carregando opções...</p> : null}
          {catalogsError ? (
            <p role="alert">Não foi possível carregar as opções.</p>
          ) : null}

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

          {previewState.data && previewIsCurrent ? (
            <section
              aria-label="Prévia do pacote"
              className="rounded border p-3"
            >
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
