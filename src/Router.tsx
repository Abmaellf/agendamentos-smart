import { Route, Routes } from "react-router-dom";
import { Login } from "./page/login";
import { DefaultLayout } from "./Layout";
import { Scheduling } from "./page/Scheduling";


export function Router() {
    return(
        <Routes>
           <Route path="/login" element={<Login />}/>

           <Route path="/" element={<DefaultLayout />}>            
            <Route path="/" element={<Scheduling /> }/>
            <Route path="/agendamento" element={<Scheduling />}/>
           </Route>
        </Routes>
    )

}