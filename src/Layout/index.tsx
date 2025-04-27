import { Outlet } from "react-router-dom";
import { Header } from "../component/Header";

export function DefaultLayout() {
    return(
        <>
            <Header />
            <Outlet />
        </>
    )
}