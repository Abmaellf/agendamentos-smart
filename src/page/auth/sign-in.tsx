import { Helmet } from 'react-helmet-async'
import { Button } from '../../components/ui/button'
import '../../globals.css'
// import { Input } from '../../components/ui/input'
import { Label } from '@radix-ui/react-label'
import { useState } from 'react'
import z from 'zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {  useNavigate } from 'react-router-dom'
import { useRequest } from '@/hooks/useRequest'
import { Loader2Icon } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const  signinSchema = z.object({
  login: z.string(),
  password: z.string()
})

type SigninSchema = z.infer<typeof signinSchema >

export function SignIn() {

 const { postRequest, loading, setLoading } =  useRequest()

 const [login, setLogin ] = useState('');

  const navigate = useNavigate()

  const { register, handleSubmit, formState: {isSubmitting}  } = useForm<SigninSchema>();
  
  const [password, setPassword ] = useState('');

  function onSubmit(data: SigninSchema) {
    setLogin(data.login)
    setPassword(data.password)
    console.log(login, password)
    postRequest(data)
      .then(
          (data) => { 
            if(data?.status === 200) {
              setLoading(false)
              toast.success('Acesso liberado')
              return  navigate('/agendamento')
            } else {
              navigate('/')
              toast.error('Dados incorretos')
              setLoading(false)
            }
          }
      )
      .catch(()=>{ alert("Usuário ou senha não identificado")})
  }
/*
  const handleLogin = async () => {
         const response = await api.post('/auth/login', {
            data: {
              login: email,
              password: password
            }
          }).then((result) => {

            console.log(result.data)

            if(result) {
              navigate('/agendamento')
            }
          })
          return response
  }
*/
  /*  
  const handleLogin = async () => {
        
    const returnObject = await axios({
            method: 'post',
            url: 'http://localhost:8082/auth/login',
            data: {
              login: email,
              password: password
            },
          }).then((result) => {
            console.log(result.data.token)
            
            return result.data;
          }).catch(()=> {
              toast.error('Dados incorretos')
          })

          return returnObject
        
            toast.success('Login efetuado com sucesso', {
            position:'bottom-center',
            duration:500000
            })
  }
*/
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
              Acompanhe suas vendas pelo painel do parceiro! s
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="email"> Seu e-mail</Label>
              <input id="email" type="email" {...register('login')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password"> Senha</Label>
              <input id="password" type="password" {...register('password')}/>
            </div>
             
                <Button disabled={isSubmitting} className="w-full" type="submit">
                  { loading ? <Loader2Icon className="animate-spin" /> : '' }
                Acessar painel
              </Button>
             
          </form>
        </div>
      </div>
    </>
  )
}
