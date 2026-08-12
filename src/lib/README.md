# Infraestrutura compartilhada

## Objetivo do módulo

Criar instâncias e utilitários técnicos reutilizados por API, contexto e componentes visuais.

## Responsabilidades e funcionalidades existentes

- `axios.ts`: instância HTTP com `baseURL` e cookies;
- `react-query.ts`: `QueryClient` global;
- `utils.ts`: combinação segura de classes Tailwind com `clsx` e `tailwind-merge`.

## Dependências internas e externas

- internas: `env.ts`;
- externas: Axios, TanStack React Query, clsx e tailwind-merge;
- módulos relacionados: `api`, `context`, `components/ui` e `App.tsx`.

## Pontos de entrada e fluxos de entrada

- operações HTTP importam `api`;
- `App` fornece `queryClient` ao React Query;
- componentes UI chamam `cn` para compor `className`.

## Arquivos críticos

Todos os três arquivos são ativos. `axios.ts` é o limite central entre frontend e backend.

## Regras próprias do módulo

- A infraestrutura HTTP deve manter credenciais de sessão, tratar `401`/`403` de forma uniforme e nunca registrar dados sensíveis.
- O escopo de `tenantId` e `unitId` deve seguir o contrato da API; não pode ser aceito cegamente de campos editáveis pelo usuário.
- Cache de dados operacionais deve incluir `tenantId` e `unitId`; dados compartilhados de pacientes/profissionais usam ao menos `tenantId`.
- O adaptador de mock e o cliente HTTP real devem implementar a mesma interface tipada.
- Utilitários desta pasta permanecem técnicos; validações de CPF, capacidade, recorrência e estados pertencem ao domínio/feature.

## Observações técnicas e débitos

- Não há interceptores para autenticação, correlação ou normalização de erros.
- O `QueryClient` usa configurações padrão e não possui política documentada de retry/stale time.
- Novos utilitários devem ser puros e independentes de regras de negócio.
