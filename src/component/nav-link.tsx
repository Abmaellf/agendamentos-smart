import { Link, type LinkProps, useLocation } from 'react-router-dom'

export type NavLinkProps = LinkProps

// Criado com o snipper rfc
export function NavLink(props: NavLinkProps) {
    const { pathname } = useLocation()
    return (
    <Link
        data-current={pathname === props.to}
        className="text-sidebar-primary-foreground hover:text-sidebar-foreground data-[current=true]:text-muted-foreground flex items-center gap-1.5 text-sm font-medium"
        //retirado  
        {...props}
    />
    )
}