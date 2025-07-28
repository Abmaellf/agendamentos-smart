import { Route, Routes } from 'react-router-dom'
import { SignIn } from './page/auth/sign-in'
import { AuthLayout } from './_layout/auth'
import { Scheduling } from './page/Scheduling'
import { Patient } from './page/patient'
import { Doctor } from './page/doctor'
import { AppLayout } from './_layout/app'
import Configuration from './page/Configuration'
import { SignUp } from './page/auth/sign-up'

export function Router() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/" element={<SignIn />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
      </Route>

      <Route element={<AppLayout />}>
        <Route path="/agendamento" element={<Scheduling />} />
        <Route path="/paciente" element={<Patient />} />
        <Route path="/doctor" element={<Doctor />} />
        <Route path="/configuration" element={<Configuration />} />
      </Route>
    </Routes>
  )
}
