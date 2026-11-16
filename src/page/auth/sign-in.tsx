import { useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Eye, EyeOff, LockKeyhole, LogIn, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useSignInMutation } from '@/api/sign-in'
import { BrandLogo } from '@/components/auth/brand-logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SignInFormValues } from '@/@types/auth'

export function SignIn() {
  const navigate = useNavigate()
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState: { isSubmitting } } =
    useForm<SignInFormValues>()
  const [authenticate] = useSignInMutation()
  const emailField = register('login')

  useEffect(() => {
    emailInputRef.current?.focus()
  }, [])

  async function handleLogin(data: SignInFormValues) {
    try {
      await authenticate({ login: data.login, password: data.password }).unwrap()
      navigate('/appointments')
      toast.success('Conectado com sucesso')
    } catch {
      toast.error('Credenciais inválidas')
    }
  }

  return (
    <>
      <Helmet title="Login" />
      <div className="flex flex-col items-center">
        <BrandLogo compact className="mb-7" />

        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#064b3d] sm:text-4xl">
            Acesse sua conta
          </h1>
          <p className="mt-2 text-base text-[#315d58] sm:text-lg">
            Acompanhe suas vendas pelo painel do parceiro
          </p>
        </div>

        <form
          onSubmit={handleSubmit(handleLogin)}
          className="mt-9 w-full space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="email" className="sr-only">
              Seu e-mail
            </Label>
            <div className="relative">
              <Mail
                aria-hidden="true"
                className="pointer-events-none absolute left-5 top-1/2 size-6 -translate-y-1/2 text-[#087344]"
                strokeWidth={2}
              />
              <Input
                id="email"
                type="email"
                placeholder="seu.email@clinicaequilibrio.com"
                autoComplete="email"
                aria-label="Seu e-mail"
                {...emailField}
                ref={(element) => {
                  emailField.ref(element)
                  emailInputRef.current = element
                }}
                className="h-[60px] rounded-2xl border-[#9cd9c6] bg-[#fbfdfc] pl-16 pr-5 text-base text-[#123f38] shadow-none placeholder:text-[#1f2424]/90 focus-visible:border-[#08a05b] focus-visible:ring-[#53db83]/30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="sr-only">
              Senha
            </Label>
            <div className="relative">
              <LockKeyhole
                aria-hidden="true"
                className="pointer-events-none absolute left-5 top-1/2 size-6 -translate-y-1/2 text-[#087344]"
                strokeWidth={2}
              />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha"
                autoComplete="current-password"
                aria-label="Senha"
                {...register('password')}
                className="h-[60px] rounded-2xl border-[#9cd9c6] bg-[#fbfdfc] pl-16 pr-14 text-base text-[#123f38] shadow-none placeholder:text-[#1f2424]/90 focus-visible:border-[#08a05b] focus-visible:ring-[#53db83]/30"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ocultar valor digitado' : 'Mostrar valor digitado'}
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#0b5545] transition hover:bg-[#e8f7ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16b75f]"
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" className="size-5" />
                ) : (
                  <Eye aria-hidden="true" className="size-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 text-sm">
            <label className="flex cursor-pointer items-center gap-2 font-medium text-[#173f3a]">
              <input
                type="checkbox"
                className="size-5 rounded border-[#8fcfb4] accent-[#087344] focus-visible:ring-2 focus-visible:ring-[#16b75f]"
              />
              <span>Lembrar-me neste dispositivo</span>
            </label>
            <button
              type="button"
              className="shrink-0 font-semibold text-[#087344] underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16b75f]"
            >
              Esqueceu sua senha?
            </button>
          </div>

          <Button
            disabled={isSubmitting}
            className="h-16 w-full rounded-2xl bg-gradient-to-r from-[#007d53] to-[#5acb32] text-lg font-bold text-white shadow-[0_8px_18px_rgba(2,155,80,0.2)] hover:from-[#006d49] hover:to-[#4fbb2b]"
            type="submit"
          >
            {isSubmitting ? (
              <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <LogIn aria-hidden="true" className="size-6" />
            )}
            Acessar painel
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-[#58736e] lg:hidden">
          Gestão de agendamento © Equilíbrio Fisioterapia &amp; Pilates –{' '}
          {new Date().getFullYear()}
        </p>

      </div>
    </>
  )
}
