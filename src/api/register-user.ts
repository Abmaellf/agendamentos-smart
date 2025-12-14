import { api } from '@/lib/axios'
import { getProfile } from './get-profile';

export interface RegisterUserBody {
  login: string
  password: string
  role: string
}

export async function registerUser({ login, password, role='USER' }: RegisterUserBody) {

  const clinic = getProfile();

  const response = await api.post(`/auth/register/${((await clinic).id)}`, { login, password, role })

  console.log("Cadastro de Usuario ", response)
  
  
  return response
}
