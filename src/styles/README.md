# Estilos globais e design tokens

## Objetivo do módulo

Documentar os estilos globais e tokens semânticos definidos em `../globals.css`.

## Responsabilidades e funcionalidades existentes

- `globals.css` carrega Tailwind CSS e as animações do shadcn;
- variáveis CSS representam cores de interface, marca e status da agenda;
- a variante `.dark` mantém os tokens do tema escuro disponível.

## Dependências internas e externas

- externa: Tailwind CSS;
- internas: `globals.css`, `components/ui` e páginas/componentes com classes utilitárias.

## Pontos de entrada e fluxos de entrada

`App.tsx` importa `globals.css` uma única vez. O Vite e o plugin do Tailwind geram os estilos usados pela aplicação.

## Arquivos críticos

- `../globals.css`: fonte única dos tokens globais e do carregamento do Tailwind.

## Regras próprias do módulo

- Cores de agendamento devem usar tokens semânticos para os sete estados canônicos e não comparações espalhadas de strings.
- Estado nunca pode ser comunicado somente por cor; texto, ícone ou rótulo acessível deve acompanhá-la.
- Ações proibidas, conflitos e capacidade esgotada precisam de estilos distinguíveis para foco, hover, disabled e erro.
- Alterações de tokens devem preservar contraste, responsividade e semântica de status.

## Observações técnicas e débitos

- O provider de tema baseado em classes existe em `components/theme`, mas permanece desconectado.
- `index.css` não é importado e ainda duplica parte dos estilos globais.
