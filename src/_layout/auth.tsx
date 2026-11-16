import {
  BarChart3,
  CalendarDays,
  Check,
  Layers3,
  LogIn,
  UserPlus,
  Users,
} from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'

import pilatesImage from '@/assets/img_pilates.png'
import { BrandLogo } from '@/components/auth/brand-logo'

const benefits = [
  { label: 'Agendamentos\ninteligentes', icon: CalendarDays },
  { label: 'Gestão de\npacientes', icon: Users },
  { label: 'Serviços e\npacotes', icon: Layers3 },
  { label: 'Relatórios\ncompletos', icon: BarChart3 },
]

export function AuthLayout() {
  const location = useLocation()
  const isSignUp = location.pathname === '/sign-up'

  return (
    <div
      data-testid="auth-shell"
      className="relative min-h-screen overflow-x-hidden bg-[#edfafa] text-[#063f35]"
    >
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="relative hidden min-h-screen overflow-hidden bg-[#005441] text-white lg:flex lg:w-[51%] lg:flex-col lg:justify-between lg:px-14 lg:py-12 xl:px-24">
          <img
            src={pilatesImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 size-full object-cover opacity-25 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,67,52,0.95),rgba(0,95,68,0.72)_48%,rgba(0,61,48,0.96))]" />
          <div className="absolute -bottom-44 -left-36 h-[390px] w-[930px] rotate-[17deg] rounded-[50%] border-t-[5px] border-[#99f25d] bg-[#079e6a]/65 shadow-[0_-16px_0_0_rgba(30,226,112,0.26)]" />
          <div className="absolute -bottom-52 -left-28 h-[330px] w-[890px] rotate-[17deg] rounded-[50%] border-t-[3px] border-[#0ccc7d] bg-[#00674f]/95" />

          <div className="relative z-10 flex flex-col gap-24">
            <BrandLogo inverse />
            <div className="max-w-[590px]">
              <h1 className="text-5xl font-light leading-[1.08] tracking-[-0.045em] xl:text-6xl">
                Crie o futuro da
                <span className="block font-bold text-[#2ee86d]">sua Clínica</span>
              </h1>
              <p className="mt-7 max-w-[580px] text-xl leading-relaxed text-white/95 xl:text-2xl">
                {isSignUp
                  ? 'Cadastre sua clínica e comece a gerenciar agendamentos, pacientes, serviços e muito mais em um único lugar.'
                  : 'Gerencie seus agendamentos, pacientes, serviços e profissionais em um único lugar.'}
              </p>
            </div>

            <div className="grid max-w-[600px] grid-cols-4 gap-3 xl:gap-4">
              {benefits.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#087d5e]/65 px-2 py-4 text-center shadow-lg backdrop-blur-sm"
                >
                  <Icon className="size-8 text-[#66f587]" strokeWidth={1.8} />
                  <span className="mt-3 whitespace-pre-line text-sm font-semibold leading-tight text-white xl:text-base">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <footer className="relative z-10 flex items-center gap-3 text-sm text-white/90">
            <span className="flex size-8 items-center justify-center rounded-full border-2 border-[#45ef72] text-[#45ef72]">
              <Check className="size-5" strokeWidth={2.5} />
            </span>
            Gestão de agendamento © Equilíbrio Fisioterapia &amp; Pilates –{' '}
            {new Date().getFullYear()}
          </footer>
        </aside>

        <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden px-4 py-8 sm:px-8 lg:px-12 lg:py-16">
          <div className="absolute -right-52 -top-52 size-[560px] rounded-full border-[18px] border-[#d5f9e8] opacity-80" />
          <div className="absolute -bottom-72 -right-40 h-[340px] w-[780px] rotate-[-13deg] rounded-[50%] border-t-[16px] border-[#c5f4df] bg-[#e0f9ef]/70" />
          <div className="absolute -bottom-80 -right-24 h-[290px] w-[730px] rotate-[-13deg] rounded-[50%] border-t-[7px] border-[#91eeb9]" />

          <div className="relative z-10 flex w-full max-w-[670px] flex-col items-center">
            <div className="mb-6 flex w-full justify-end">
              <Link
                to={isSignUp ? '/sign-in' : '/sign-up'}
                className="inline-flex h-12 items-center gap-3 rounded-full bg-white px-6 text-base font-semibold text-[#074c3c] shadow-[0_8px_22px_rgba(7,83,63,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(7,83,63,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17b85d] focus-visible:ring-offset-2"
              >
                {isSignUp ? <LogIn className="size-5" /> : <UserPlus className="size-5" />}
                {isSignUp ? 'Efetuar login' : 'Novo Usuário'}
              </Link>
            </div>

            <div className="mb-5 self-start lg:hidden">
              <BrandLogo compact />
            </div>

            <div className="w-full rounded-[2rem] bg-white/95 p-6 shadow-[0_20px_55px_rgba(4,83,64,0.14)] backdrop-blur sm:p-10 lg:p-12">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
