import { Outlet } from 'react-router-dom'
import { Header } from '../component/Header'

export function AppLayout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  )
}
