# Menu móvel

## Objetivo do módulo

Fornecer uma sobreposição de navegação para telas com largura de até `980px`.

## Responsabilidades e funcionalidades existentes

Controla visibilidade por propriedade, bloqueia o scroll vertical do `body`, anima abertura/fechamento e exibe opções de menu.

## Dependências internas e externas

- interna: utilitário `cn`;
- externas: React, React Router, Lucide e Tailwind CSS;
- módulo relacionado: `AppLayout` e `Header`.

## Ponto de entrada e fluxo de entrada

`AppLayout` mantém `menuIsVisible`; `Header` define `true`; o ícone `X` define `false`.

## Arquivos críticos

- `index.tsx`: efeito de scroll, composição, overlay, transições e estado de visibilidade.

## Regras próprias do módulo

- O menu móvel deve expor as mesmas rotas, unidade ativa e permissões da navegação desktop.
- Itens precisam ser links ou ações reais e fechar o menu após navegação; placeholders de financeiro não devem sugerir função entregue.
- Ações administrativas devem respeitar `ADMIN`/`BASIC`, mantendo a validação definitiva na API.
- O componente deve gerenciar foco, tecla Escape, rótulos e restauração de scroll como um menu/dialog acessível.
- Troca obrigatória de senha e logout precisam permanecer acessíveis no fluxo móvel.

## Observações técnicas e débitos

- O foco ainda não fica contido dentro do diálogo enquanto ele está aberto.
