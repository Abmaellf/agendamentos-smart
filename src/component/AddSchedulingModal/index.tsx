import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"
import { Label } from "@/components/ui/label"

export function AddSchedulingModal() {
  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button variant="outline">Novo agendamento</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicione um novo agendamento</DialogTitle>
            <DialogDescription>
              Faça qui o agendamento de seus pacientes, caso não encontre-o, faça o registro
             no menu Paciente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">

            <div className="grid gap-3">
              <Label htmlFor="name-1">Nome</Label>
              <Input id="name-1" name="name" placeholder="Nome do paciente"  />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="username-1">pathology</Label>
              <Input id="username-1" name="username" defaultValue="@peduarte" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="username-1">dateSchenduling</Label>
              <Input id="username-1" name="username" defaultValue="@peduarte" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="username-1">status</Label>
              <Input id="username-1" name="username" defaultValue="@peduarte" />
            </div>

          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}
