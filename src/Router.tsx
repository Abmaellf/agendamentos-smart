import { Route, Routes } from "react-router-dom";
import { Login } from "./page/login";
import { Agendamento } from "./page/Agendamento";
import { DefaultLayout } from "./Layout";


export function Router() {
    return(
        <Routes>
           <Route path="/" element={<DefaultLayout />}>            
            <Route path="/" element={<Agendamento />}/>
           </Route>
        </Routes>
    )

}