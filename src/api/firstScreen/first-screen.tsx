import { Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import { getAuthorizationToken } from "../auth";
import { useNavigate } from "react-router-dom";

export function FirstScreen() {
 const navigate = useNavigate()

    useEffect(() => {
        const token = getAuthorizationToken()
        if(token) {
             navigate('/agendamento');
        } else {
            navigate('/sign-in')
        }
    }, []);
    return (<Loader2Icon className="animate-spin" />) 
}

