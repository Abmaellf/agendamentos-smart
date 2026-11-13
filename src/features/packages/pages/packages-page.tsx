import { FormEvent, useState } from 'react'
import { toast } from 'sonner'

import { useGetAppointmentSessionQuery, useGetServicesQuery, useGetUnitsQuery } from '@/features/appointments/api/appointments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type PackageWeekDay, useCreateServicePackageMutation, useGetServicePackagesQuery, useUpdateServicePackageStatusMutation } from '../api/packages'

const weekDays: Array<[PackageWeekDay, string]> = [
  ['SUNDAY', 'Domingo'], ['MONDAY', 'Segunda'], ['TUESDAY', 'Terça'], ['WEDNESDAY', 'Quarta'],
  ['THURSDAY', 'Quinta'], ['FRIDAY', 'Sexta'], ['SATURDAY', 'Sábado'],
]

export function PackagesPage() {
  const session = useGetAppointmentSessionQuery().data
  const packages = useGetServicePackagesQuery()
  const units = useGetUnitsQuery()
  const services = useGetServicesQuery()
  const [createPackage, createState] = useCreateServicePackageMutation()
  const [changeStatus] = useUpdateServicePackageStatusMutation()
  const [form, setForm] = useState({ name: '', description: '', unitId: '', serviceId: '', totalSessions: '10', totalPrice: '', weekDays: [] as PackageWeekDay[] })
  const isAdmin = session?.user.role === 'ADMIN'

  function toggleDay(day: PackageWeekDay) {
    setForm((current) => ({ ...current, weekDays: current.weekDays.includes(day) ? current.weekDays.filter((value) => value !== day) : [...current.weekDays, day] }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.name.trim() || !form.unitId || !form.serviceId || !form.totalPrice || form.weekDays.length === 0) {
      toast.error('Preencha os campos obrigatórios e selecione ao menos um dia.')
      return
    }
    try {
      await createPackage({ ...form, name: form.name.trim(), description: form.description.trim() || undefined, totalSessions: Number(form.totalSessions), active: true }).unwrap()
      toast.success('Pacote criado com sucesso.')
      setForm({ name: '', description: '', unitId: '', serviceId: '', totalSessions: '10', totalPrice: '', weekDays: [] })
    } catch {
      toast.error('Não foi possível salvar o pacote. Revise os dados e tente novamente.')
    }
  }

  if (session && !isAdmin) return <main className="p-6"><h1 className="text-2xl font-bold">Pacotes</h1><p className="mt-3">Somente administradores podem gerenciar pacotes.</p></main>

  return <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
    <header><h1 className="text-2xl font-bold text-[#20382d]">Pacotes de serviços</h1><p className="text-sm text-muted-foreground">Configure sessões, dias semanais e valor total por unidade.</p></header>
    <form onSubmit={submit} className="grid gap-4 rounded-xl border bg-white p-5 md:grid-cols-2">
      <div><Label htmlFor="package-name">Nome</Label><Input id="package-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div><Label htmlFor="package-description">Descrição</Label><Input id="package-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <label>Unidade<select className="mt-1 h-10 w-full rounded-md border px-3" value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })}><option value="">Selecione</option>{units.data?.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
      <label>Serviço<select className="mt-1 h-10 w-full rounded-md border px-3" value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })}><option value="">Selecione</option>{services.data?.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label>
      <div><Label htmlFor="package-sessions">Total de sessões</Label><Input id="package-sessions" type="number" min="1" value={form.totalSessions} onChange={(e) => setForm({ ...form, totalSessions: e.target.value })} /></div>
      <div><Label htmlFor="package-price">Valor total</Label><Input id="package-price" inputMode="decimal" value={form.totalPrice} onChange={(e) => setForm({ ...form, totalPrice: e.target.value })} placeholder="400.00" /></div>
      <fieldset className="md:col-span-2"><legend className="font-medium">Dias da semana ({form.weekDays.length} por semana)</legend><div className="mt-2 flex flex-wrap gap-3">{weekDays.map(([day, label]) => <label key={day} className="flex items-center gap-1 text-sm"><input type="checkbox" checked={form.weekDays.includes(day)} onChange={() => toggleDay(day)} />{label}</label>)}</div></fieldset>
      <div className="md:col-span-2"><Button type="submit" disabled={createState.isLoading}>Salvar pacote</Button></div>
    </form>
    {packages.isLoading ? <p role="status">Carregando pacotes...</p> : null}
    {packages.isError ? <p role="alert">Não foi possível carregar os pacotes.</p> : null}
    {packages.data?.length === 0 ? <p>Nenhum pacote cadastrado.</p> : null}
    <section className="grid gap-3 md:grid-cols-2">{packages.data?.map((item) => <article key={item.id} className="rounded-xl border bg-white p-4"><h2 className="font-semibold">{item.name}</h2><p className="text-sm">{item.serviceName} · {item.unitName}</p><p className="mt-2 text-sm">{item.totalSessions} sessões · {item.weeklyFrequency} por semana · R$ {item.totalPrice}</p><p className="text-xs text-muted-foreground">{item.weekDays.join(', ')}</p><Button className="mt-3" variant="outline" onClick={() => changeStatus({ id: item.id, active: !item.active })}>{item.active ? 'Desativar' : 'Ativar'}</Button></article>)}</section>
  </main>
}
