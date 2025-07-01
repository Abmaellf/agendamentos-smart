import { Outlet } from 'react-router-dom'
import { Header } from '../component/Header'
import { useState } from 'react'
import { MenuMobile } from '../component/MenuMobile'

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
    </>
  )
}
