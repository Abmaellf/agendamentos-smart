# Design

## Context

Conforme a `proposal.md` e a spec delta, a página atual de pacotes concentra
consulta, filtros, formulário e ações em um único componente. O adaptador de
consulta aceita filtros, mas reduz a resposta da API a uma lista e não preserva
metadados de paginação. A feature de pacientes já demonstra padrões locais de
tabela, filtro, modal e paginação que podem orientar a composição sem criar uma
dependência entre domínios.

## Goals / Non-Goals

**Goals:**

- Separar o estado de orquestração da página das responsabilidades visuais de
  filtro, tabela, paginação, detalhe e formulário modal.
- Adotar paginação server-side e um normalizador de resposta que permita
  validar o frontend também com respostas legadas em coleção durante a
  transição do contrato.
- Reutilizar o mesmo formulário para criação e edição, sem duplicar validação
  ou transformação do payload.
- Manter seleção, filtros e página estáveis durante abertura/fechamento de
  detalhe e modal.

**Non-Goals:**

- Alterar entidades, regras de imutabilidade, autorização ou endpoints de
  mutação definidos pela gestão de pacotes.
- Introduzir uma biblioteca de DataTable, um gerenciador global de estado ou
  uma nova dependência visual.
- Paginar no navegador uma coleção completa como solução definitiva; o fallback
  legado serve apenas para compatibilidade controlada de mocks/ambientes.

## Decisions

### Orquestração central e componentes de apresentação

`PackagesPage` continuará responsável por sessão, autorização, estado de
filtros aplicados, índice/tamanho da página, pacote selecionado e modo do
modal. Abaixo dele serão extraídos componentes específicos da feature:

- filtro: mantém o rascunho local e emite aplicar/limpar;
- tabela: recebe linhas, seleção, estado de carregamento e callbacks de ação;
- paginação: recebe metadados normalizados e callbacks de navegação;
- detalhe: recebe o pacote carregado e ações de editar/situação/fechar;
- modal/formulário: recebe modo, pacote inicial, dependências de catálogo e
  callbacks de sucesso/cancelamento.

Essa divisão permite testes focados e reuso dentro da feature. Colocar estado
em um contexto global foi descartado porque o fluxo é local à rota e isso
aumentaria o acoplamento entre páginas.

### Contrato de página e compatibilidade do adaptador

O tipo remoto da listagem será normalizado para uma página com `content`,
`page`, `size`, `totalElements`, `totalPages` e `last`. A consulta enviará
`page` zero-based, `size` e os filtros preenchidos; valores vazios não serão
enviados.

Durante a transição, o normalizador reconhecerá tanto a resposta paginada
quanto a resposta atual em array ou `{ content }`. Para a forma legada, ele
criará metadados coerentes de uma única página e registrará a limitação nos
testes/README; não deverá fabricar páginas adicionais no cliente. A alternativa
de carregar todos os registros e fatiar localmente foi descartada por não
escalar e por esconder a necessidade do contrato server-side.

### Seleção e carregamento do detalhe

O identificador selecionado será a única fonte de seleção. Ao selecionar uma
linha, a página exibirá imediatamente os dados disponíveis da linha e consultará
o detalhe pelo endpoint existente quando necessário para garantir descrição e
demais campos completos. Se a seleção deixar de existir após paginação ou
filtro, ela será limpa; a mudança de página não deve conservar detalhe de um
registro que não está no conjunto mestre visível.

O painel lateral em telas largas e o bloco empilhado em telas estreitas serão
duas apresentações do mesmo estado. Um drawer/modal para o detalhe foi
descartado porque faria a navegação mestre-detalhe perder contexto e competiria
com o modal de criação/edição.

### Modal único para criação e edição

O botão acima da tabela abrirá o modal em modo criação. A ação de editar abrirá
o mesmo modal em modo edição, preenchendo-o a partir do detalhe consultado. O
formulário continuará usando o schema e as mutations existentes; apenas sua
composição visual sai do fluxo inline. Fechar sem salvar não invalidará a lista
nem limpará filtros/seleção. Após sucesso, as tags existentes invalidarão a
consulta e o estado da seleção será atualizado de maneira previsível.

### Layout e acessibilidade

O container da página usará uma largura máxima maior que a atual, com grid
responsivo para tabela/detalhe. A tabela manterá `TableHeader`/`TableRow`/
`TableCell` semânticos, mas ações e seleção terão nomes acessíveis e estado
selecionado explícito. O modal usará o primitive já presente no projeto para
garantir foco, fechamento e retorno de foco; nenhuma implementação paralela de
dialog será criada.

### Verificação

Os testes de integração da página cobrirão query params de página/filtros,
metadados, troca de página, seleção/detalhe, modal de criação/edição,
cancelamento, estados vazio/erro e atualização após mutation. Testes unitários
dos componentes cobrirão callbacks, controles de paginação e estados
acessíveis. O contrato de resposta será testado para forma paginada e fallback
legado.

## Risks / Trade-offs

- [A API irmã pode ainda responder sem metadados de paginação] → manter o
  normalizador compatível para desenvolvimento e mocks, mas tratar o contrato
  paginado como requisito de integração e registrar a limitação sem fingir
  paginação real.
- [O detalhe pode ficar desatualizado após mutation ou troca de página] → usar
  tags RTK Query existentes, limpar seleção quando o item sair da página e
  refazer a consulta de detalhe ao reabrir.
- [A tabela pode exigir rolagem horizontal em telas muito estreitas] → permitir
  overflow apenas no contêiner semântico da tabela, preservar ações essenciais
  e impedir overflow horizontal do layout geral; validar em viewport estreita.
- [A extração pode duplicar o formulário durante a migração] → manter um único
  componente de formulário e mover a lógica gradualmente, validando cobertura
  antes de remover o formulário inline.

## Migration Plan

1. Confirmar com o backend o envelope paginado e os nomes de `page`, `size` e
   metadados; alinhar mocks sem alterar contratos de mutação.
2. Criar tipos/normalizador de página e atualizar o endpoint de listagem.
3. Extrair os componentes de filtro, tabela, paginação, detalhe e formulário
   modal; substituir a composição de cards e o formulário inline.
4. Atualizar testes e README da feature; executar lint, testes afetados, build e
   validação estrita da change.

Rollback: restaurar a composição anterior da página e manter o adaptador
compatível; não remover campos, registros ou endpoints de pacote.
