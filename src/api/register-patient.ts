import { api } from '@/lib/axios'

export interface PatientBody {
  name: string
}

export async function RegisterPatient({
  name
}: PatientBody) {

   
   await api.post('/patient/save',{
      name
    }, 
    {
        headers: {
          'Content-Type': 'application/json',
        } 
    }
  )
}
