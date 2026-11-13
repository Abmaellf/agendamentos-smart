# Componentes compartilhados

## Objetivo do módulo

Reunir elementos visuais reutilizados por layouts e páginas, além de componentes específicos da agenda ainda mantidos fora da respectiva feature.

## Responsabilidades e funcionalidades existentes

| Componente/pasta      | Função                               | Estado                      |
| --------------------- | ------------------------------------ | --------------------------- |
| `AppSidebar`          | Navegação lateral responsiva         | Ativo                       |
| `AppTopbar`           | Ações globais da casca interna      | Ativo                       |
| `account-menu.tsx`    | Perfil da clínica/usuário            | Ativo                       |
| `form-field.tsx`      | Rótulo, controle e erro acessíveis   | Ativo                       |
| `Card`                | Cartões antigos da agenda            | Legado sem consumidor       |
| `WeekDate`            | Rótulos antigos dos dias úteis       | Legado sem consumidor       |
| `nav-link.tsx`        | Link com estado atual                | Órfão                       |
| `theme`               | Tema claro/escuro Tailwind           | Órfão                       |
| `ui`                  | Primitivos Radix/shadcn              | Parcialmente ativo          |

## Dependências internas e externas

- internas: `components/ui`, `context`, `api`, estilos e tipos compartilhados em
  `src/@types`;
- externas: React, Router, RTK Query, React Hook Form, Zod, Radix, Lucide, date-fns, Tailwind e sonner;
- módulos relacionados: layouts, agenda e pacientes.

## Pontos de entrada e fluxos de entrada

- `AppLayout` entra por `AppTopbar` e `AppSidebar`, com a mesma definição tipada de entradas em ambos os breakpoints;
- `AppTopbar` concentra o hamburger, busca local, navegação temporal, ação de agendamento, notificações apresentacionais e menu de perfil;
- `AppointmentsPage` usa apenas componentes de `features/appointments`;
- `Patient` é composto por `features/patients`; componentes específicos não
  entram mais por esta camada compartilhada;

## Arquivos críticos

- `AppSidebar/index.tsx`: navegação lateral, destinos disponíveis/indisponíveis e card informativo;
- `AppTopbar/index.tsx`: ações globais da casca, data compartilhada e acionamento responsivo da sidebar;
- `account-menu.tsx`: avatar, identificação da conta e menu de perfil baseado no perfil remoto existente;
- `form-field.tsx`: apresentação compartilhada de rótulo, controle e mensagem
  de erro; não contém schemas, chamadas HTTP ou regras de domínio;
- `features/appointments/pages/appointments-page.tsx`: fonte da grade semanal;
- `ui/`: base visual da maioria dos formulários.

## Regras próprias do módulo

- Componentes compartilhados devem ser predominantemente visuais; regras de agenda, autorização e persistência entram por propriedades/hooks tipados.
- `FormField` recebe o controle e o erro por propriedades; validação e estado
  continuam nos componentes das features consumidoras.
- A interface pode ocultar ou desabilitar ações por papel, mas o adaptador/API deve repetir a autorização.
- Componentes de agenda devem usar IDs, estados e DTOs canônicos e representar um agendamento por paciente, inclusive em turmas.
- Formulários precisam exibir validações de conflito, capacidade e permissão sem oferecer exceção administrativa.
- Fluxos de criação de paciente ou agendamento devem possuir uma única implementação e atualizar o cache correspondente.
- Dados pessoais devem ser limitados ao necessário para a ação; o MVP não deve introduzir campos ou componentes de prontuário.

## Observações técnicas e débitos

- Há componentes compartilhados que ainda possuem regra de negócio e chamadas
  de API; novos componentes específicos devem ficar na feature correspondente.
- `Card` e `WeekDate` permanecem como componentes legados sem consumidores e
  podem ser removidos em uma limpeza posterior.
- Componentes órfãos devem ser conectados somente após confirmar contrato ou removidos.
- Novos componentes específicos devem ficar junto à feature até existir reuso comprovado.
- A busca do `AppTopbar` é somente entrada local nesta change; não apresenta resultados nem cria endpoint.
- O controle de notificações é somente apresentacional enquanto não houver fonte remota de notificações; contador só aparece quando fornecido explicitamente.
