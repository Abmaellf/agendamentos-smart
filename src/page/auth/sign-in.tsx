import { Helmet } from 'react-helmet-async'
import { Button } from '../../components/ui/button'
import '../../globals.css'
import { Label } from '@radix-ui/react-label'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { signIn } from '@/api/sign-in'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
// import { setAuthorizationToken } from '@/api/auth'
import { Loader2Icon } from 'lucide-react'
// 1. Importe o useRef e o useEffect do React
import { useEffect, useRef } from 'react'

import type { SignInFormValues } from '@/@types/components'

export function SignIn() {

  const navigate = useNavigate();

    // 2. Crie a referência para o elemento de input de e-mail
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const { register, handleSubmit, formState: {isSubmitting}  } = useForm<SignInFormValues>();
  
  const { mutateAsync: authenticate} = useMutation({
    mutationFn: signIn,
  })

   // 3. Crie o efeito que roda assim que o componente é desenhado na tela
  useEffect(() => {
    // Coloca o cursor de foco direto no campo de e-mail
    emailInputRef.current?.focus();
  }, []) // O array vazio garante que isso só rode uma vez (no carregamento)

 async function handleLogin(data: SignInFormValues) {
  
    try {
        const response = await authenticate({ login: data.login, password: data.password})
        // if(response) {
          // setAuthorizationToken(response.data.token)
          console.log(response.data.token,"auth/signin")
          console.log(response.data.user,"auth/signin")
        // }
        navigate('/appointments')
        toast.success('Conectado com sucesso', {     })
    } catch {
      toast.error('Credenciais inválidas')
    }
  }
  
  return (
    <>
      <Helmet title="Login" />
      <div className="p-8">
         <div className="p-8">
									<Button variant={'ghost'} asChild className="absolute top-8 right-8">
									  <Link to={'/sign-up'}>Novo Usuário</Link>
									</Button>
        </div>
        <div className="flex w-[350px] flex-col justify-center gap-6">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
            </h1>
            <p className="text-muted-foreground text-sm">
              Acompanhe suas vendas pelo painel do parceiro! s 
            </p>
          </div>

          <form onSubmit={handleSubmit(handleLogin)} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="email"> Seu e-mail</Label>
              <input id="email" type="email" {...register('login')} ref={(e) => {
                  register('login').ref(e); // Mantém o react-hook-form funcionando
                  emailInputRef.current = e; // Salva a referência na nossa variável
                }} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password"> Senha</Label>
              <input id="password" type="password" {...register('password')}/>
            </div>
             
                <Button disabled={isSubmitting} className="w-full" type="submit">
                  { isSubmitting ? <Loader2Icon className="animate-spin" /> : '' }
                Acessar painel
              </Button>
          </form>
        </div>
      </div>
    </>
  )
}
