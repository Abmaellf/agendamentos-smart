import { Building2, FileText, Mail, UserPlus } from 'lucide-react'
import { Helmet } from 'react-helmet-async'

import { BrandLogo } from '@/components/auth/brand-logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SignUp() {
  return (
    <>
      <Helmet title="Cadastrar usuário" />
      <div className="flex flex-col items-center">
        <BrandLogo compact className="mb-6" />

        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#064b3d] sm:text-4xl">
            Faça seu cadastro
          </h1>
          <p className="mx-auto mt-2 max-w-[550px] text-base leading-relaxed text-[#315d58] sm:text-lg">
            Crie sua clínica digital personalizada e comece a gerenciar seus
            atendimentos agora mesmo!
          </p>
        </div>

        <form
          className="mt-7 w-full space-y-4"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="space-y-2">
            <Label htmlFor="clinic-name" className="flex items-center gap-2 text-base text-[#173f3a]">
              <Building2 aria-hidden="true" className="size-5 text-[#07533f]" />
              Nome da clínica
            </Label>
            <Input
              id="clinic-name"
              type="text"
              placeholder="Ex.: Clínica Equilíbrio"
              autoComplete="organization"
              className="h-[58px] rounded-2xl border-[#9cd9c6] bg-[#fbfdfc] px-5 text-base shadow-none placeholder:text-[#777d7e] focus-visible:border-[#08a05b] focus-visible:ring-[#53db83]/30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sign-up-email" className="flex items-center gap-2 text-base text-[#173f3a]">
              <Mail aria-hidden="true" className="size-5 text-[#07533f]" />
              Seu e-mail
            </Label>
            <Input
              id="sign-up-email"
              type="email"
              placeholder="Ex.: contato@clinicaequilibrio.com"
              autoComplete="email"
              className="h-[58px] rounded-2xl border-[#9cd9c6] bg-[#fbfdfc] px-5 text-base shadow-none placeholder:text-[#777d7e] focus-visible:border-[#08a05b] focus-visible:ring-[#53db83]/30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf-cnpj" className="flex items-center gap-2 text-base text-[#173f3a]">
              <FileText aria-hidden="true" className="size-5 text-[#07533f]" />
              CPF ou CNPJ
            </Label>
            <Input
              id="cpf-cnpj"
              type="text"
              placeholder="Digite o CPF ou CNPJ"
              inputMode="numeric"
              className="h-[58px] rounded-2xl border-[#9cd9c6] bg-[#fbfdfc] px-5 text-base shadow-none placeholder:text-[#777d7e] focus-visible:border-[#08a05b] focus-visible:ring-[#53db83]/30"
            />
          </div>

          <Button
            type="button"
            className="mt-3 h-16 w-full rounded-2xl bg-gradient-to-r from-[#007d53] to-[#5acb32] text-lg font-bold text-white shadow-[0_8px_18px_rgba(2,155,80,0.2)] hover:from-[#006d49] hover:to-[#4fbb2b]"
          >
            <UserPlus aria-hidden="true" className="size-6" />
            Salvar cadastro
          </Button>
        </form>

      </div>
    </>
  )
}
