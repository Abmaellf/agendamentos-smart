import { api } from "@/lib/axios";

interface GetProfileResponse {
    id: string
    login: string
    password: string
    role: string
    clinic:{
        id: string
        code: number
        name: string
        createdAt: string 
    },
    username: string
}

export async function getProfile() {
    const response = await api.get<GetProfileResponse>('auth/me')
    console.log(response)
    return response.data
}