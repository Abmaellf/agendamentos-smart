import { Helmet } from 'react-helmet-async'
import { Button } from '../../components/ui/button'
import '../../globals.css'
import { Input } from '../../components/ui/input'
import { Label } from '@radix-ui/react-label'
import { Link, redirect } from 'react-router-dom'

export function SignUp() {
  function onSubmit() {
    return redirect('/agendamento')
  }
  return (
    <>
      <Helmet title="Login" />
      <div className="p-8">
        <div className="flex w-[350px] flex-col justify-center gap-6">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Faça seu cadastro
            </h1>
            <p className="text-muted-foreground text-sm">
              Crie sua clinica digital customizada, faça agora o seu cadastro!
            </p>
          </div>

          <form className="flex flex-col gap-4">

            <div className="space-y-2">
              <Label htmlFor="nome-empresa"> Nome da clinica</Label>
              <Input id="nome-empresa" type="text" />
            </div>

             <div className="space-y-2">
              <Label htmlFor="email"> Seu e-mail</Label>
              <Input id="email" type="email" />
            </div>

             <div className="space-y-2">
              <Label htmlFor="cpf-cnpj"> CPF ou CNPJ</Label>
              <Input id="cpf0-cnpj" type="text" />
            </div>

            <Link to={'/agendamento'}>
              <Button onClick={onSubmit} className="w-full" type="submit">
                Salvar cadastro
              </Button>
            </Link>

          </form>
        </div>
      </div>
    </>
  )
}
