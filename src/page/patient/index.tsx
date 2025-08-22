import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  Table,
} from '@/components/ui/table'
import PatientTableRows from './component/patient-table-rows'
import { PatientTableFilter } from './component/patient-table-filter'
import { Dialog, DialogTrigger } from '@radix-ui/react-dialog'
import CreatePatientDialog from './component/create-patient-dialog'
import { SchedulingContext } from '@/context/SchedulingContext'
import { useContextSelector } from 'use-context-selector'
import { AddPatientModal } from '@/components/AddPatientModal'
import { Pagination } from '@/components/pagination'
import { useEffect } from 'react'

export function Patient() {
  const patients = useContextSelector(
				SchedulingContext, 
				    (context) => {
				    return context.patients
	})

   const fetchPatients = useContextSelector(
				SchedulingContext, 
				    (context) => {
				    return context.fetchPatients
	})

   useEffect(() => {
    fetchPatients()
    }, [])

  return (
    <div>
      <div className="flex flex-col gap-4 w-auto p-2 pt-20">
        <h1 className="text-3xl font-bold tracking-tight"> Pacientes </h1>
      </div>
      <div className="space-y-2.5 p-2">
       <div className='flex justify-between'>
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
                <TableHead className="w-[140px]"> Código </TableHead>
                <TableHead> Paciente </TableHead>
                  <TableHead> Empresa </TableHead>
                <TableHead className="w-[140px]"> Status </TableHead>
                <TableHead className="w-[180px]"> Data de cadastro </TableHead>
                
                <TableHead className="w-[164px]"> </TableHead>
                <TableHead className="w-[132px]"> </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {
                patients?.map((patient) => {
                   return <PatientTableRows patientObj={patient} key={patient.id} />
                })
              }
            </TableBody>
          </Table>
          <Pagination pageIndex={0} totalCount={10} perPage={10} />
        </div>
      </div>
    </div>
  )
}
