# Infraestrutura compartilhada

## Objetivo do módulo

Criar instâncias e utilitários técnicos reutilizados por API, contexto e componentes visuais.

## Responsabilidades e funcionalidades existentes

- `axios.ts`: instância HTTP com `baseURL` e cookies;
- `axios-base-query.ts`: adaptador tipado do Axios para consultas e mutações remotas;
- `base-api.ts`: API-base RTK com tags compartilhadas;
- `store.ts`: store, reducer e middleware da API;
- `utils.ts`: combinação segura de classes Tailwind com `clsx` e `tailwind-merge`.

## Dependências internas e externas

- internas: `env.ts`;
- externas: Axios, Redux Toolkit, React Redux, clsx e tailwind-merge;
- módulos relacionados: `api`, `context`, `components/ui` e `App.tsx`.

## Pontos de entrada e fluxos de entrada

- operações HTTP importam `api`;
- `App` fornece `store` pelo `Provider` do React Redux;
- APIs por domínio injetam endpoints na `baseApi` e reutilizam `axiosBaseQuery`;
- componentes UI chamam `cn` para compor `className`.

## Arquivos críticos

`axios.ts`, `axios-base-query.ts`, `base-api.ts`, `store.ts` e `utils.ts` são ativos. `axios.ts` é o limite central entre frontend e backend.

## Regras próprias do módulo

- A infraestrutura HTTP deve manter credenciais de sessão, tratar `401`/`403` de forma uniforme e nunca registrar dados sensíveis.
- O escopo de `tenantId` e `unitId` deve seguir o contrato da API; não pode ser aceito cegamente de campos editáveis pelo usuário.
- Cache de dados operacionais deve incluir `tenantId` e `unitId`; dados compartilhados de pacientes/profissionais usam ao menos `tenantId`.
- O adaptador de mock e o cliente HTTP real devem implementar a mesma interface tipada.
- Utilitários desta pasta permanecem técnicos; validações de CPF, capacidade, recorrência e estados pertencem ao domínio/feature.

## Observações técnicas e débitos

- Não há interceptores para autenticação, correlação ou normalização de erros.
- Falhas não tratadas pelo Axios são serializadas como `{ status, data }` para o RTK Query; políticas globais de retry ainda não foram definidas.
- Novos utilitários devem ser puros e independentes de regras de negócio.
