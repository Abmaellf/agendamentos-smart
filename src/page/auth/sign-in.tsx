import { Helmet } from 'react-helmet-async'
import { Button } from '../../components/ui/button'
import '../../globals.css'
import { Label } from '@radix-ui/react-label'
import z from 'zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { signIn } from '@/api/sign-in'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
// import { setAuthorizationToken } from '@/api/auth'
import { Loader2Icon } from 'lucide-react'
// import { setAuthorizationToken } from '@/api/auth'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const  signinSchema = z.object({
  login: z.string(),
  password: z.string()
})

type SigninSchema = z.infer<typeof signinSchema >

export function SignIn() {

  const navigate = useNavigate();

  const { register, handleSubmit, formState: {isSubmitting}  } = useForm<SigninSchema>();
  
  const { mutateAsync: authenticate} = useMutation({
    mutationFn: signIn,
  })
 async function handleLogin(data: SigninSchema) {
  
    try {
        const response = await authenticate({ login: data.login, password: data.password})
        // if(response) {
          // setAuthorizationToken(response.data.token)
          console.log(response.data.token,"auth/signin")
          console.log(response.data.user,"auth/signin")
        // }
        navigate('/agendamento')
        toast.success('Conectado com sucesso', {     })
    } catch {
      toast.error('Credenciais inválidas')
    }
  }
  
  return (
    <>
      <Helmet title="Login" />
      <div className="p-8">
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
              <input id="email" type="email" {...register('login')} />
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
