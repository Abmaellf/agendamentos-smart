import { Building, ChevronDown, Download, LogOut } from 'lucide-react'
import { useRef, useState } from 'react'

import avatar from '@/assets/abm_avatar.png'
import { useGetProfileQuery } from '@/api/get-profile'

import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

interface AccountMenuProps {
  avatarSrc?: string
}

export default function AccountMenu({ avatarSrc = avatar }: AccountMenuProps) {
  const profileTriggerRef = useRef<HTMLButtonElement>(null)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const { data: profile, isError, isLoading } = useGetProfileQuery()

  const profileUnavailable = isLoading || isError || !profile

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={profileTriggerRef}
            variant="ghost"
            aria-label={
              profile?.username
                ? `Abrir menu do perfil de ${profile.username}`
                : 'Abrir menu do perfil'
            }
            className="h-12 gap-2 rounded-full px-2 text-[#20382d] select-none hover:bg-[#edf8f2] hover:text-[#143f32] focus-visible:ring-[#78c85e]"
          >
            <span className="hidden max-w-36 truncate text-sm font-medium sm:inline">
              {profile?.username || 'Conta'}
            </span>
            <img
              src={avatarSrc}
              alt=""
              className="size-10 rounded-full border-2 border-white/90 object-cover"
            />
            <ChevronDown aria-hidden="true" className="hidden size-4 sm:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <span className="text-muted-foreground text-xs font-normal">
              {profile?.username || 'Minha conta'}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={() => setIsProfileDialogOpen(true)}>
            <Building className="mr-2 size-4" />
            <span>Perfil</span>
          </DropdownMenuItem>

          <DropdownMenuItem className="text-rose-500 dark:text-rose-400">
            <LogOut className="mr-2 size-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            profileTriggerRef.current?.focus()
          }}
        >
          <DialogHeader>
            <DialogTitle>Detalhes do perfil</DialogTitle>
            <DialogDescription>
              Consulte os dados da sua conta e baixe a foto de perfil exibida.
            </DialogDescription>
          </DialogHeader>

          {profileUnavailable ? (
            <p className="text-muted-foreground text-sm">
              Os dados do perfil não estão disponíveis no momento.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
              <div className="flex flex-col items-center gap-2">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={`Foto de perfil de ${profile.username || profile.login}`}
                    className="size-24 rounded-full border object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground text-center text-xs">
                    Foto indisponível
                  </span>
                )}
              </div>

              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Nome</dt>
                  <dd className="font-medium">{profile.username || 'Não informado'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Login</dt>
                  <dd className="font-medium">{profile.login || 'Não informado'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Perfil de acesso</dt>
                  <dd className="font-medium">{profile.role || 'Não informado'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Clínica</dt>
                  <dd className="font-medium">{profile.clinicName || profile.clinic?.name || 'Não informado'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Unidade</dt>
                  <dd className="font-medium">{profile.unitName || profile.activeUnitName || 'Não informado'}</dd>
                </div>
              </dl>
            </div>
          )}

          <DialogFooter>
            {avatarSrc ? (
              <Button asChild variant="outline">
                <a href={avatarSrc} download="foto-de-perfil.png">
                  <Download aria-hidden="true" />
                  Baixar foto
                </a>
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
