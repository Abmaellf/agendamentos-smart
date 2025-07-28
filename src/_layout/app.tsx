import { Outlet } from 'react-router-dom'
import { Header } from '../components/Header'
import { useState } from 'react'
import { MenuMobile } from '../components/MenuMobile'
// import { ThemeProvider } from "@/components/theme/theme-provider"

export function AppLayout() {
  const [menuIsVisible, setMenuIsVisible] = useState(false)
  return (
    <>
   
      <MenuMobile
        menuIsVisible={menuIsVisible}
        setMenuIsVisible={setMenuIsVisible}
      />

      <Header setMenuIsVisible={setMenuIsVisible} />

      <Outlet />
      <footer>
        Aqui vai ficar o rodapé
      </footer>
    {/* </ThemeProvider> */}
    </>
  )
}
