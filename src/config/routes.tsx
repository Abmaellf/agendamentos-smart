import type { ReactNode } from 'react'

import { FirstScreen } from '@/api/firstScreen/first-screen'
import { AppLayout } from '@/_layout/app'
import { AuthLayout } from '@/_layout/auth'
import Configuration from '@/page/Configuration'
import { SignIn } from '@/page/auth/sign-in'
import { SignUp } from '@/page/auth/sign-up'
import { Doctor } from '@/page/doctor'
import { Scheduling } from '@/page/Scheduling'
import { Patient } from '@/pages/Patient'

import { permissions, type Permission } from './permissions'

export const routePaths = {
  home: '/',
  signIn: '/sign-in',
  signUp: '/sign-up',
  scheduling: '/agendamento',
  patient: '/paciente',
  doctor: '/doctor',
  configuration: '/configuration',
} as const

export type RouteConfig = {
  path: string
  element: ReactNode
  permission?: Permission
}

export const publicRoutes: RouteConfig[] = [
  {
    path: routePaths.home,
    element: <FirstScreen />,
  },
]

export const authLayout = {
  element: <AuthLayout />,
  routes: [
    {
      path: routePaths.signIn,
      element: <SignIn />,
    },
    {
      path: routePaths.signUp,
      element: <SignUp />,
    },
  ],
}

export const appLayout = {
  element: <AppLayout />,
  routes: [
    {
      path: routePaths.scheduling,
      element: <Scheduling />,
    },
    {
      path: routePaths.patient,
      element: <Patient />,
      permission: permissions.patient.list,
    },
    {
      path: routePaths.doctor,
      element: <Doctor />,
    },
    {
      path: routePaths.configuration,
      element: <Configuration />,
    },
  ],
}
