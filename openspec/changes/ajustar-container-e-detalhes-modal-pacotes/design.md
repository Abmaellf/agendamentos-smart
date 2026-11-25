# Design

## Context

A página de pacotes já consulta a lista de forma paginada, mantém filtros e
seleção em `PackagesPage` e usa um `PackageDetailPanel` renderizado ao lado da
tabela. O projeto já possui um primitive de diálogo com overlay, semântica
Radix e gerenciamento de foco, usado pelo formulário de criação/edição. A
mudança é visual e de interação; os dados continuam vindo das consultas atuais
de lista e detalhe.

## Goals / Non-Goals

**Goals:**

- Estabelecer um container único e mais largo para filtros, tabela e paginação
  em viewports amplas, com adaptação responsiva.
- Transformar o detalhe selecionado em um diálogo modal que reutilize o
  conteúdo e as ações do detalhe atual.
- Manter seleção, paginação, filtros, carregamento, erro, autorização e ações
  de criação/edição independentes da abertura do modal de detalhes.
- Garantir foco inicial, foco contido e retorno de foco para a origem da abertura.

**Non-Goals:**

- Alterar endpoints, parâmetros, payloads, cache, modelo de dados ou regras de
  autorização dos pacotes.
- Alterar a aparência ou o contrato do modal de criação/edição além do que for
  necessário para coexistir com o modal de detalhes.
- Introduzir paginação no cliente, nova dependência ou redesign geral da tabela.

## Decisions

### Container responsivo centralizado

Substituir o limite estreito atual do container da página por uma regra de
largura ampla e responsiva, mantendo `width: 100%`, margens laterais e o
overflow horizontal restrito à tabela quando as colunas não couberem. A largura
alvo deve ser conferida contra a imagem de referência em viewport ampla, sem
fixar uma largura que prejudique notebooks ou telas estreitas.

Alternativas consideradas:

- `max-width: none`: descartada porque pode deixar linhas excessivamente longas
  e dificultar a leitura em monitores ultrawide.
- Manter `max-w-[1600px]`: descartada porque é justamente a limitação visual
  apontada pelo pedido.

### Modal de detalhe com o primitive existente

Reaproveitar o primitive `Dialog` já usado pela feature e adaptar a
apresentação do conteúdo do detalhe para um diálogo amplo. Em viewport larga,
o conteúdo pode ser alinhado visualmente à direita ou receber largura maior
para se aproximar da referência; em viewport estreita, deve usar quase toda a
largura disponível e permitir rolagem interna quando necessário. O modal terá
nome/título derivados do pacote e fechamento explícito.

Alternativas consideradas:

- Manter o `aside` mestre-detalhe: descartada porque não atende à interação
  modal solicitada.
- Criar um overlay manual: descartada porque duplicaria foco, teclado e
  acessibilidade já fornecidos pelo primitive compartilhado.

### Estado de consulta separado do estado de abertura

Manter o identificador selecionado para carregar o detalhe e introduzir um
estado explícito de abertura do detalhe, ou equivalente, para que fechar o
modal não precise limpar filtros, página ou dados selecionados. A abertura por
linha e por botão deve registrar o elemento de origem para retorno de foco.
Editar continuará usando o estado e o modal de formulário existentes.

### Conteúdo único para o detalhe

Extrair ou adaptar o conteúdo atual do painel para ser renderizado dentro do
diálogo, preservando os estados de carregamento/erro e as ações de editar e
alterar situação. A ação de editar deve fechar ou suspender o detalhe conforme
o primitive compartilhado permitir, sem perder o pacote selecionado.

## Risks / Trade-offs

- [Risco] Um diálogo largo pode ultrapassar a viewport em telas pequenas. →
  Aplicar limites relativos à viewport, rolagem interna e validar em viewport
  estreita.
- [Risco] Dois modais da feature podem competir pelo foco. → Manter abertura
  mutuamente exclusiva entre detalhe e criação/edição e testar a sequência de
  abrir detalhe, editar, cancelar e fechar.
- [Risco] Aumentar a largura pode deixar a tabela visualmente dispersa. →
  Preservar larguras mínimas de colunas, alinhamento e revisar visualmente a
  densidade das ações na largura de referência.
- [Risco] O fechamento pode perder a origem quando a página for atualizada. →
  Guardar a referência de foco apenas enquanto ela estiver conectada ao DOM e
  usar fallback para o botão/linha selecionado.

## Migration Plan

Não há migração de dados, alteração de rota ou mudança de contrato HTTP. A
entrega pode ser publicada como alteração de frontend; em caso de regressão
visual ou de foco, o rollback consiste em restaurar a composição anterior da
página e o painel contextual, sem necessidade de intervenção na API.
