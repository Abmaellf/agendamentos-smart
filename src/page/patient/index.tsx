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
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import CreatePatientDialog from './component/create-patient-dialog'
// import { useContext, useEffect, useState } from 'react'
import { SchedulingContext } from '@/context/SchedulingContext'
import { useContext } from 'react'

export function Patient() {

  const { patients } = useContext(SchedulingContext);

  return (
    <div>
      <div className="flex flex-col gap-4 w-auto p-2 pt-20">
        <h1 className="text-3xl font-bold tracking-tight"> Pacientes </h1>
      </div>
      <div className="space-y-2.5 p-2">
        <PatientTableFilter />

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="size-4 mr-2" />
              Novo Paciente
            </Button>
          </DialogTrigger>

          <CreatePatientDialog />
        </Dialog>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[64px]"></TableHead>
                <TableHead className="w-[140px]"> Código </TableHead>
                <TableHead> Paciente </TableHead>
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
        </div>
      </div>
    </div>
  )
}
