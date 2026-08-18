# Páginas e fluxos de tela

## Objetivo do módulo

Concentrar os componentes associados diretamente a rotas e coordenar os fluxos de interface.

## Responsabilidades e funcionalidades existentes

| Pasta           | Rota                   | Estado                        |
| --------------- | ---------------------- | ----------------------------- |
| `auth`          | `/sign-in`, `/sign-up` | Login ativo; cadastro visual  |
| `patient`       | `/paciente`            | Lista e criação parciais      |
| `doctor`        | `/doctor`              | Placeholder                   |
| `Configuration` | `/configuration`       | Placeholder vazio             |

## Dependências internas e externas

- internas: componentes, contexto e API;
- externas: React Router, React Query, forms, Zod, date-fns, Helmet e bibliotecas visuais;
- módulos relacionados: `Router.tsx` e `_layout`.

## Pontos de entrada e fluxos de entrada

Todas as páginas entram pelo `Router`. Páginas públicas usam `AuthLayout`; páginas internas usam `AppLayout` e, consequentemente, Header/perfil.

## Arquivos críticos

- `auth/sign-in.tsx`: porta de entrada autenticada;
- `features/appointments/pages/appointments-page.tsx`: fluxo principal de agenda;
- `patient/index.tsx`: fluxo de pacientes.

## Regras próprias do módulo

- Páginas públicas cobrem cadastro, validação de e-mail, login e troca obrigatória da senha inicial; páginas internas exigem sessão e `tenantId` válidos.
- O MVP deve oferecer fluxos de agenda, pacientes, profissionais, serviços e usuários, mesmo que algumas rotas ainda não existam no protótipo.
- Toda página de dados precisa respeitar o escopo da clínica e, quando operacional, da unidade ativa.
- Ações administrativas devem refletir `ADMIN`/`BASIC`, mantendo a autorização definitiva no mock/API.
- Estados de carregamento, erro, vazio, sucesso e acesso negado são obrigatórios quando aplicáveis.
- Financeiro, prontuário, salas/equipamentos e múltiplas unidades operacionais não devem ser apresentados como entregues no primeiro MVP.

## Observações técnicas e débitos

- As rotas internas não têm guarda de autenticação.
- Não há lazy loading; todas as páginas entram no bundle inicial.
- Novas páginas de domínio devem permanecer na respectiva feature; `src/page`
  conserva apenas as páginas legadas ainda não migradas.
- Páginas incompletas devem continuar identificadas como placeholders até terem integração comprovada.
