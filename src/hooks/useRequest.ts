import { api } from "@/lib/axios";
import { useState } from "react"

interface Props {
    login: string,
    password: string
}

export const useRequest = () => {

    const [ loading, setLoading ] = useState(false);

    const postRequest = async (data: Props) => {

        setLoading(true)

        try{
            const response = await api.post('auth/login',
                {
                    login: data.login,
                    password: data.password
                },
                {
                    headers: {'Content-Type': 'application/json',}
                }
            );
                console.log(response)

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