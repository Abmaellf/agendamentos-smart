# Proposal

## Why

A listagem de pacotes ainda ocupa uma área menor do que a disponível em
viewports amplas, comprimindo a tabela e as ações administrativas. Além disso,
o detalhe de um pacote é apresentado como painel contextual dentro da página,
quando a experiência desejada é abrir os detalhes em um modal identificável,
sem tirar a pessoa do contexto da listagem.

## What Changes

- Aumentar a largura responsiva do container principal da página de listagem de
  pacotes, aproveitando melhor a área útil em telas amplas e preservando margens
  e leitura em telas menores.
- Manter filtros, tabela, paginação e ações administrativas dentro do mesmo
  container amplo, evitando que a abertura do detalhe reduza ou desconfigure a
  listagem.
- Alterar a ação `Detalhes` e a seleção de uma linha para abrir um modal de
  detalhes do pacote, com título, fechamento explícito e os dados já exibidos
  no detalhe atual.
- Permitir fechar o modal por seus controles acessíveis e retornar o foco ao
  controle que abriu o detalhe, preservando filtros, paginação e seleção.
- Preservar a abertura do modal de criação/edição, as ações de situação, as
  mensagens de carregamento/erro e o comportamento restrito a administradores.
- Não alterar rotas, endpoints HTTP, payloads, persistência, permissões de
  domínio ou regras de imutabilidade dos pacotes.

## Capabilities

### New Capabilities

- `service-package-listing`: apresentação responsiva da listagem administrativa
  de pacotes e abertura modal do detalhe de um pacote.

### Modified Capabilities

<!-- A capability equivalente já existe em uma change anterior concluída, mas
     ainda não foi promovida para openspec/specs/. O delta desta change usa o
     mesmo caminho de capability para manter a continuidade do contrato. -->

## Impact

- Afeta a composição visual de `PackagesPage`, o componente de detalhe e os
  testes da feature `src/features/packages`.
- Pode reutilizar o primitive de diálogo já presente na aplicação; não requer
  nova dependência.
- Não há impacto previsto em contratos HTTP, rotas, dados, autorização de
  servidor ou integração com a API.
- A validação deve cobrir viewport ampla e estreita, abertura/fechamento,
  foco, carregamento/erro do detalhe e preservação do estado da listagem.
