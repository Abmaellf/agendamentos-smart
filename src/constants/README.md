# Constantes compartilhadas

## Objetivo do módulo

Centralizar identificadores estáveis usados por mais de uma operação.

## Responsabilidades e funcionalidades existentes

Não há mais constantes de autenticação neste módulo: a sessão usa cookies `HttpOnly` e não é armazenada pelo JavaScript.

## Dependências internas e externas

- interna: nenhuma;
- externa: nenhuma;
- módulos relacionados: `src/api/session.ts` e `src/lib/session-client.ts`.

## Ponto de entrada e fluxo de entrada

O módulo não participa da autenticação; cookies e renovação são responsabilidade da API e da camada de sessão HTTP.

## Arquivo crítico

- Nenhum arquivo de autenticação é mantido aqui.

## Regras próprias do módulo

- Constantes transversais podem nomear papéis e estados canônicos, mas a fonte TypeScript deve evitar duplicação com os tipos de domínio.
- Papéis reconhecidos na clínica são `ADMIN` e `BASIC`; estados de agenda devem seguir a enumeração definida em `@types`/domínio.
- Chaves de cache e rotas que dependem da clínica devem incluir `tenantId` e, quando aplicável, `unitId`.
- Chaves de armazenamento não podem introduzir uma segunda estratégia de autenticação ou guardar senha/token de forma insegura.

## Observações técnicas e débitos

- O módulo está órfão porque a estratégia atual usa cookie `jwt` e Axios com credenciais.
- Não manter duas estratégias de token sem contrato explícito.
