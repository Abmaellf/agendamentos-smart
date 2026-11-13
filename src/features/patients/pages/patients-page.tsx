import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  Table,
} from '@/components/ui/table'
import { Dialog, DialogTrigger } from '@radix-ui/react-dialog'
import { useContextSelector } from 'use-context-selector'
import { useEffect } from 'react'

import PatientTableRows from '../components/patient-table-rows'
import { PatientTableFilter } from '../components/patient-table-filter'
import CreatePatientDialog from '../components/create-patient-dialog'
import { PatientContext } from '../model/patient-context'
import { AddPatientModal } from '../components/add-patient-modal'
import { Pagination } from '../components/pagination'

export function Patient() {
  const patients = useContextSelector(
    PatientContext,
    (context) => context.patients,
  )

  const fetchPatients = useContextSelector(
    PatientContext,
    (context) => context.fetchPatients,
  )

  useEffect(() => {
    fetchPatients().then((res) => {
      console.log('Dados da api na page', res.data.content)
    })
  }, [])

  return (
    <div>
      <div className="flex flex-col gap-4 w-auto p-2 pt-20">
        <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
      </div>
      <div className="space-y-2.5 p-2">
        <div className="flex justify-between">
          <PatientTableFilter />

          <Dialog>
            <DialogTrigger asChild>
              <AddPatientModal />
            </DialogTrigger>

            <CreatePatientDialog />
          </Dialog>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[64px]"></TableHead>
                <TableHead className="w-[140px]">Código</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead className="w-[140px]">Status</TableHead>
                <TableHead className="w-[180px]">Data de cadastro</TableHead>
                <TableHead className="w-[100px]"></TableHead>
                <TableHead className="w-[120px]">Ação</TableHead>
                <TableHead className="w-[132px]"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {Array.isArray(patients) &&
                patients.map((patient) => (
                  <PatientTableRows patientObj={patient} key={patient.id} />
                ))}
            </TableBody>
          </Table>
          <Pagination pageIndex={0} totalCount={10} perPage={10} />
        </div>
      </div>
    </div>
  )
}
