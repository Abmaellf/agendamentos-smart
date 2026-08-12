# Tema do styled-components

## Objetivo do módulo

Definir os tokens de cor consumidos por componentes que usam styled-components.

## Responsabilidades e funcionalidades existentes

`default.ts` exporta `defaultTheme` com paletas de cinza, verde, vermelho, azul, amarelo, roxo e cores-base.

## Dependências internas e externas

- consumido por `App.tsx`, `@types/styled.d.ts` e estilos styled-components;
- módulos relacionados: `styles`, `components/Card`, `components/Header` e `globals.css`, que mantém outro conjunto de tokens.

## Ponto de entrada e fluxo de entrada

`defaultTheme` → `ThemeProvider` de `App` → interpolação `theme.colors[...]` nos componentes.

## Arquivo crítico

- `default.ts`: fonte dos tokens do estilo legado.

## Regras próprias do módulo

- O tema deve oferecer tokens semânticos para `AGENDADO`, `CONFIRMADO`, `EM_ATENDIMENTO`, `CONCLUIDO`, `CANCELADO`, `FALTA` e `REMARCADO`.
- Tokens de estado precisam manter contraste acessível nos temas suportados e não podem ser a única indicação do estado.
- Nomes genéricos de paleta não devem ser consumidos diretamente por novas regras de negócio; a associação estado-cor deve ficar centralizada.

## Observações técnicas e débitos

- Não há semântica formal para todos os tokens; muitos nomes são paletas genéricas.
- As cores de status estão codificadas em `CardPatient/styles.ts`.
- Consolidar com o tema Tailwind somente por migração planejada.
