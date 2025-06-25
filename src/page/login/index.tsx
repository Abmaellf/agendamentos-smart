import { Helmet } from 'react-helmet-async'
import { Button } from '../../components/ui/button'
import '../../globals.css'
import { Input } from '../../components/ui/input'
import { Label } from '@radix-ui/react-label'
import { Link, redirect } from 'react-router-dom'

export function Login() {
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
              Acessar Painel
            </h1>
            <p className="text-muted-foreground text-sm">
              Acompanhe suas vendas pelo painel do parceiro!
            </p>
          </div>

          <form className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="email"> Seu e-mail</Label>
              <Input id="email" type="email" />
            </div>
            <Link to={'/agendamento'}>
              <Button onClick={onSubmit} className="w-full" type="submit">
                Acessar painel
              </Button>
            </Link>
          </form>
        </div>
      </div>
    </>
  )
}
