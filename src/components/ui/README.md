# Primitivos de interface

## Objetivo do módulo

Fornecer componentes visuais sem regra de negócio, baseados no padrão shadcn, Radix e classes Tailwind.

## Responsabilidades e funcionalidades existentes

| Arquivo             | Uso ativo identificado                     |
| ------------------- | ------------------------------------------ |
| `button.tsx`        | Formulários, navegação, tabela e paginação |
| `alert.tsx`         | Preparado para feedback da agenda          |
| `badge.tsx`         | Preparado para status de agendamento       |
| `calendar.tsx`      | Seletor de data da agenda                  |
| `card.tsx`          | Preparado para cartões da agenda           |
| `dialog.tsx`        | Modais de paciente/agendamento             |
| `dropdown-menu.tsx` | Header, conta e tema órfão                 |
| `input.tsx`         | Formulários                                |
| `label.tsx`         | Formulários e calendário                   |
| `popover.tsx`       | Calendário da agenda                       |
| `separator.tsx`     | Header                                     |
| `table.tsx`         | Lista de pacientes                         |
| `pagination.tsx`    | Sem consumidor ativo                       |
| `select.tsx`        | Sem consumidor ativo                       |
| `skeleton.tsx`      | Preparado para carregamento da agenda      |

## Dependências internas e externas

- interna: `lib/utils.ts` para composição de classes;
- externas: Radix UI, react-day-picker, date-fns, Lucide, CVA e React;
- módulos relacionados: todos os componentes e páginas visuais.

## Pontos de entrada e fluxos de entrada

Os consumidores importam exports nomeados diretamente de cada arquivo. O catálogo foi configurado por `components.json`; não existe arquivo `index.ts` agregador.

## Arquivos críticos

`button.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `calendar.tsx` e `table.tsx` sustentam os principais fluxos atuais.

## Regras próprias do módulo

- Primitivos não conhecem `tenantId`, papéis, estados de agenda ou contratos de API; recebem estado e callbacks dos consumidores.
- `disabled` deve representar operações indisponíveis, como conflito ou ausência de profissional, mas nunca ser a única barreira de autorização.
- Diálogos destrutivos de cancelamento devem exigir confirmação e campo de motivo; não deve existir diálogo de exclusão de agendamento.
- Formulários devem associar rótulo, descrição e erro aos campos e manter navegação por teclado/foco.
- Selects e calendários devem suportar os campos tipados de paciente, profissional, serviço, unidade, data e horário sem embutir fixtures.

## Observações técnicas e débitos

- `pagination.tsx` duplica a finalidade de `components/pagination.tsx` e está órfão.
- `select.tsx` está órfão, embora mantenha sua dependência Radix declarada.
- A página de paciente importa `Dialog`/`DialogTrigger` diretamente do Radix, mas o conteúdo do wrapper local.
- Alterações nesses primitivos têm impacto transversal e devem preservar acessibilidade e API pública.
