# Componentes compartilhados

## Objetivo do módulo

Reunir elementos visuais reutilizados por layouts e páginas, além de componentes específicos da agenda ainda mantidos fora da respectiva feature.

## Responsabilidades e funcionalidades existentes

| Componente/pasta      | Função                               | Estado                      |
| --------------------- | ------------------------------------ | --------------------------- |
| `Header`              | Navegação desktop e menu da conta    | Ativo                       |
| `MenuMobile`          | Sobreposição de navegação responsiva | Ativo, links apenas visuais |
| `account-menu.tsx`    | Perfil da clínica/usuário            | Ativo                       |
| `Card`                | Cartões antigos da agenda            | Legado sem consumidor       |
| `WeekDate`            | Rótulos antigos dos dias úteis       | Legado sem consumidor       |
| `AddPatientModal.tsx` | Cadastro mínimo de paciente          | Ativo, duplicado            |
| `pagination.tsx`      | Resumo/paginador visual              | Ativo, sem callbacks        |
| `nav-link.tsx`        | Link com estado atual                | Órfão                       |
| `theme`               | Tema claro/escuro Tailwind           | Órfão                       |
| `ui`                  | Primitivos Radix/shadcn              | Parcialmente ativo          |

## Dependências internas e externas

- internas: `components/ui`, `context`, `api`, estilos e tipos locais;
- externas: React, Router, React Query, React Hook Form, Zod, Radix, Lucide, date-fns, Tailwind e sonner;
- módulos relacionados: layouts, agenda e pacientes.

## Pontos de entrada e fluxos de entrada

- `AppLayout` entra por `Header` e `MenuMobile`;
- `AppointmentsPage` usa apenas componentes de `features/appointments`;
- `Patient` entra por `AddPatientModal` e `Pagination`;
- `Header` entra por `AccountMenu`, que consulta o perfil.

## Arquivos críticos

- `Header/index.tsx` e `account-menu.tsx`: navegação e consulta transversal de perfil;
- `AddPatientModal.tsx`: mutation de paciente;
- `features/appointments/pages/appointments-page.tsx`: fonte da grade semanal;
- `ui/`: base visual da maioria dos formulários.

## Regras próprias do módulo

- Componentes compartilhados devem ser predominantemente visuais; regras de agenda, autorização e persistência entram por propriedades/hooks tipados.
- A interface pode ocultar ou desabilitar ações por papel, mas o adaptador/API deve repetir a autorização.
- Componentes de agenda devem usar IDs, estados e DTOs canônicos e representar um agendamento por paciente, inclusive em turmas.
- Formulários precisam exibir validações de conflito, capacidade e permissão sem oferecer exceção administrativa.
- Fluxos de criação de paciente ou agendamento devem possuir uma única implementação e atualizar o cache correspondente.
- Dados pessoais devem ser limitados ao necessário para a ação; o MVP não deve introduzir campos ou componentes de prontuário.

## Observações técnicas e débitos

- Há componentes compartilhados que possuem regra de negócio e chamadas de API.
- `Card` e `WeekDate` permanecem como componentes legados sem consumidores e
  podem ser removidos em uma limpeza posterior.
- O link de pacientes no Header contém espaços finais no caminho.
- Componentes órfãos devem ser conectados somente após confirmar contrato ou removidos.
- Novos componentes específicos devem ficar junto à feature até existir reuso comprovado.
