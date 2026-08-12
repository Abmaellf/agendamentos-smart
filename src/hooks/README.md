# Hooks customizados

## Objetivo do módulo

Reservar hooks React reutilizáveis para lógica de interface ou integração.

## Responsabilidades e funcionalidades existentes

Não há hook ativo. `useRequest.ts` contém somente uma implementação comentada de login e armazenamento de token.

## Dependências internas e externas

Os imports também estão comentados: tipos de usuário, contexto global, Axios e React. Módulos relacionados: `context`, `api` e `page/auth`.

## Pontos de entrada e fluxos de entrada

Nenhum consumidor ou fluxo ativo foi identificado.

## Arquivo crítico

- `useRequest.ts`: registro de uma abordagem antiga, não código executável.

## Regras próprias do módulo

- Hooks de dados devem encapsular funções tipadas de API e chaves de React Query escopadas por `tenantId`/`unitId`.
- Hooks de permissão podem facilitar a apresentação, mas não substituem autorização no adaptador ou backend.
- Uma mutação de agendamento deve invalidar agenda, capacidade e histórico relacionados de forma previsível.
- Hooks de sessão não devem persistir senha nem implementar uma estratégia paralela de token.
- Regras puras de domínio, como detecção de sobreposição, não devem depender de React e precisam permanecer testáveis fora de hooks.

## Observações técnicas e débitos

- O módulo é órfão.
- Evitar manter arquivos totalmente comentados como documentação histórica; decisões devem ficar nos documentos ou histórico Git.
- Hooks futuros não devem duplicar a estratégia de React Query já instalada.
