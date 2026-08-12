# Estilos compartilhados legados

## Objetivo do módulo

Manter tema e estilos globais associados ao styled-components.

## Responsabilidades e funcionalidades existentes

- `themes/default.ts` define tokens usados por Header, agenda, cartões e menu móvel;
- `global.ts` declara reset e fundo global, mas não é montado.

## Dependências internas e externas

- externas: styled-components e Tailwind importado como efeito colateral;
- internas: declaração em `@types/styled.d.ts` e componentes estilizados;
- módulos relacionados: `globals.css` e `components/ui`.

## Pontos de entrada e fluxos de entrada

`App.tsx` importa `defaultTheme` e o fornece ao `ThemeProvider` do styled-components. `GlobalStyle` aparece apenas comentado.

## Arquivos críticos

- `themes/default.ts`: crítico enquanto houver styled-components ativos;
- `global.ts`: órfão.

## Regras próprias do módulo

- Cores de agendamento devem usar tokens semânticos para os sete estados canônicos e não comparações espalhadas de strings.
- Estado nunca pode ser comunicado somente por cor; texto, ícone ou rótulo acessível deve acompanhá-la.
- Ações proibidas, conflitos e capacidade esgotada precisam de estilos distinguíveis para foco, hover, disabled e erro.
- A migração entre styled-components e Tailwind deve preservar contraste, responsividade e semântica de status.

## Observações técnicas e débitos

- O sistema mantém tokens de styled-components e variáveis CSS Tailwind em paralelo.
- O import `tailwindcss` dentro de TypeScript não é necessário para definir o objeto de tema.
- Migrar tokens exige preservar os status cromáticos da agenda até confirmação de negócio.
