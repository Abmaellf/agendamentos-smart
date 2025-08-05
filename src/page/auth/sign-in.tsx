import { Helmet } from 'react-helmet-async'
import { Button } from '../../components/ui/button'
import '../../globals.css'
// import { Input } from '../../components/ui/input'
import { Label } from '@radix-ui/react-label'
import { useState } from 'react'
import z from 'zod'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { toast } from 'sonner'
import {  useNavigate } from 'react-router-dom'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const  signinSchema = z.object({
  email: z.string(),
  password: z.string()
})

type SigninSchema = z.infer<typeof signinSchema >

export function SignIn() {

  const navigate = useNavigate()

  const { register, handleSubmit } = useForm<SigninSchema>();

  const [email, setMail ] = useState('');
  
  const [password, setPassword ] = useState('');

  function onSubmit(data: SigninSchema) {
    setMail(data.email)
    setPassword(data.password)
    console.log(data)
    handleLogin()
  }

  const handleLogin = async () => {
          const returnObject = await axios({
            method: 'post',
            url: 'http://localhost:8082/auth/login',
            data: {
              login: email,
              password: password
            },
          }).then((result) => {
            alert('Login efetuado')
          
            navigate('/agendamento')
            return result.data;
          }).catch(()=> {
              toast.error('Dados incorretos')
          })

          return returnObject
            // toast.success('Login efetuado com sucesso', {
            // position:'bottom-center',
            // duration:500000
            // })
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
              Acompanhe suas vendas pelo painel do parceiro! s
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="email"> Seu e-mail</Label>
              <input id="email" type="email" {...register('email')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password"> Senha</Label>
              <input id="password" type="password" {...register('password')}/>
            </div>
              <Button className="w-full" type="submit">
                Acessar painel
              </Button>
          </form>
        </div>
      </div>
    </>
  )
}
