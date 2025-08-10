import { UserType } from "@/@types/UserTypes";
import { useGlobalContext } from "@/context/useGlobalContext";
import { api } from "@/lib/axios";
import { useState } from "react"

interface Props {
    login: string,
    password: string
}

export const useRequest = () => {

    const {  setAccessToken } = useGlobalContext()

    const [ loading, setLoading ] = useState(false);

    const postRequest = async (data: Props) => {

        setLoading(true)

        try{
            const response = await api.post<UserType>('auth/login',
                {
                    login: data.login,
                    password: data.password
                },
                {
                    headers: {'Content-Type': 'application/json',}
                }
            );
            setAccessToken(response.data.token)   
            console.log(response.data.token, 'Aqui é o token')
            console.log(response.data.user, 'Aqui é o usuario')

                return response;

            } catch (error) {
                 console.error("Catch", error);
            }
    }
     
     return {
                loading,
                setLoading,
                postRequest,
               
            }
}