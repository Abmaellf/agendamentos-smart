# Código-fonte da aplicação

## Objetivo do módulo

Concentrar a SPA React: bootstrap, providers, rotas, páginas, integração HTTP, estado compartilhado, componentes e estilos.

## Responsabilidades e funcionalidades existentes

- montar `App` no DOM;
- compor providers globais;
- declarar rotas públicas e internas;
- oferecer telas de autenticação, agenda, pacientes e placeholders de profissional/configuração;
- integrar com a API definida por `VITE_API_URL`.

## Dependências internas e externas

- internas: todos os submódulos descritos abaixo;
- externas: React, React DOM, React Router, React Query, Axios, Tailwind, Radix, Zod e bibliotecas auxiliares;
- módulos relacionados: configurações Vite/TypeScript na raiz e `data.json` para simulação local.

## Pontos de entrada e fluxos de entrada

- `main.tsx`: entrada do bundle e montagem de `App`;
- `App.tsx`: composição de cookies, contexto, roteador, metadados, notificações e cache;
- `Router.tsx`: entrada de navegação para todas as páginas;
- `env.ts`: validação antecipada da URL da API;
- `globals.css`: estilos Tailwind efetivamente carregados.

Fluxo principal: `main.tsx` → `App.tsx` → providers → `Router.tsx` → layout → página → componente/contexto/API.

## Arquivos críticos

| Caminho         | Papel                    |
| --------------- | ------------------------ |
| `App.tsx`       | Raiz de composição       |
| `Router.tsx`    | Contrato de rotas        |
| `env.ts`        | Contrato de configuração |
| `_layout/`      | Cascas das rotas         |
| `page/`         | Fluxos de tela           |
| `api/` e `lib/` | Integração externa       |
| `context/`      | Estado compartilhado     |

## Regras próprias do módulo

- Toda feature deve distinguir estado implementado de requisito planejado e apontar para `docs/Requisitos do MVP.md` quando aplicável.
- Dados de clínica devem ser isolados por `tenantId`; fluxos operacionais devem aceitar `unitId`, usando a unidade padrão no primeiro MVP.
- Rotas internas exigirão sessão válida, e-mail confirmado e troca da senha temporária antes do uso normal.
- Permissões de `ADMIN` e `BASIC` controlam a interface, mas também precisam ser verificadas pelo adaptador/API.
- Estado remoto deve passar por funções de API tipadas e React Query; componentes e páginas não devem acessar Axios nem o arquivo de mock diretamente.
- Entidades e estados de agendamento devem possuir contratos canônicos, sem strings ou formas redefinidas por tela.

## Observações técnicas e débitos

- `StrictMode` está comentado em `main.tsx`.
- O provider de agenda envolve também a área pública.
- Não existe error boundary, rota 404 ou guarda global de autenticação.
- A divisão atual é por camada técnica; regras de domínio não possuem módulo próprio.
- Veja `docs/Arquitetura do Sistema.md` para riscos e regras oficiais.
- As regras acima ainda não estão implementadas de forma transversal no commit atual.
