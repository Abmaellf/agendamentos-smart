# Constantes compartilhadas

## Objetivo do módulo

Centralizar identificadores estáveis usados por mais de uma operação.

## Responsabilidades e funcionalidades existentes

Define `AUTHORIZATION_KEY`, chave destinada a armazenar autorização no `localStorage`.

## Dependências internas e externas

- interna: consumida apenas por `src/api/auth.ts`;
- externa: nenhuma;
- módulos relacionados: `src/api/storageProxy.ts` e autenticação.

## Ponto de entrada e fluxo de entrada

`authorizationConstants.ts` → `api/auth.ts` → `storageProxy.ts`. A cadeia não possui consumidor ativo.

## Arquivo crítico

- `authorizationConstants.ts`: única constante do módulo.

## Regras próprias do módulo

- Constantes transversais podem nomear papéis e estados canônicos, mas a fonte TypeScript deve evitar duplicação com os tipos de domínio.
- Papéis reconhecidos na clínica são `ADMIN` e `BASIC`; estados de agenda devem seguir a enumeração definida em `@types`/domínio.
- Chaves de cache e rotas que dependem da clínica devem incluir `tenantId` e, quando aplicável, `unitId`.
- Chaves de armazenamento não podem introduzir uma segunda estratégia de autenticação ou guardar senha/token de forma insegura.

## Observações técnicas e débitos

- O módulo está órfão porque a estratégia atual usa cookie `jwt` e Axios com credenciais.
- Não manter duas estratégias de token sem contrato explícito.
