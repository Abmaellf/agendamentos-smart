import { Link, type LinkProps, useLocation } from 'react-router-dom'

export type NavLinkProps = LinkProps

// Criado com o snipper rfc
export function NavLink(props: NavLinkProps) {
    const { pathname } = useLocation()
    return (
    <Link
        data-current={pathname === props.to}
        // className=" text-sidebar-foreground  hover:text-sidebar-ring data-[current=true]:text-muted-foreground flex items-center justify-center gap-5 text-sm font-medium"
        className=" text-white  hover:text-sidebar-ring data-[current=true]:text-black flex items-center justify-center text-accent font-light"
        //retirado  
        {...props}
    />
    )
}