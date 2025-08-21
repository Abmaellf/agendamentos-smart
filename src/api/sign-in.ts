import { api } from '@/lib/axios'

export interface SignInBody {
  login: string
  password: string
}

export async function signIn({ login, password }: SignInBody) {
  const response = await api.post('/auth/login', { login, password })

  console.log(response.data.token,"api/signin")
  console.log(response.data.user,"api/signin")
  
  
  return response
}
