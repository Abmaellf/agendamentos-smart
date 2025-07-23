import { X } from 'lucide-react'
import { ContainerMobile } from './styles'
import { useEffect } from 'react'

interface MenuVisibleProps {
  menuIsVisible: boolean
  setMenuIsVisible(data: boolean): void
}

export function MenuMobile({
  menuIsVisible,
  setMenuIsVisible,
}: MenuVisibleProps) {
  useEffect(() => {
    document.body.style.overflowY = menuIsVisible ? 'hidden' : 'auto'
  }, [menuIsVisible])
  return (
    <>
      <ContainerMobile isvisible={menuIsVisible}>
        <X onClick={() => setMenuIsVisible(false)} />
        <nav>
          <div> Agendamento </div>
          <div> Paciente </div>
          <div> Contato </div>
          <div> Sair </div>
        </nav>
      </ContainerMobile>
    </>
  )
}
