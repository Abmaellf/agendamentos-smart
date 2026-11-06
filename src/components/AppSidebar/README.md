# Menu lateral da área interna

## Objetivo

Oferecer uma única navegação responsiva para as rotas internas da aplicação.

## Comportamento entregue

- em telas a partir de `981px`, a barra lateral fica persistente ao lado do conteúdo;
- no modo desktop, o botão de recolhimento reduz a barra a uma coluna de ícones;
  os rótulos continuam disponíveis por acessibilidade e `title`, e o mesmo
  botão permite expandi-la novamente;
- abaixo desse breakpoint, o mesmo menu é um painel lateral aberto por controle nomeado;
- Escape, o controle de fechamento e uma navegação disponível fecham o painel compacto;
- o layout bloqueia temporariamente a rolagem do documento e devolve o foco ao acionador;
- Serviços, Relatórios e Financeiro comunicam `Em breve` sem rota;
- o card de rodapé é apenas informativo, sem link ou ação de domínio.

## Limites

As entradas disponíveis refletem exclusivamente as rotas já entregues. A marca é
textual/CSS nesta change; nenhum asset novo é usado.
