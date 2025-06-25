import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <>
      <div className="grid min-h-screen grid-cols-2">
        <div className="border-foreground/5 bg-muted text-muted-foreground flex h-full flex-col justify-between border-r p-10">
          <div className="text-foreground flex items-center gap-3 text-lg">
            <span className="font-semibold"> Clínica Equilíbrio</span>
          </div>
          <footer>
            Gestão de agendamento &copy; Equilibrio Fisioterapia & Pilates -{' '}
            {new Date().getFullYear()}
          </footer>
        </div>
        <div className="flex flex-col items-center justify-center">
          <Outlet />
        </div>
      </div>
    </>
  )
}
