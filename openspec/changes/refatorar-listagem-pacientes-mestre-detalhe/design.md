# Design

## Context

Consulte `proposal.md` para a motivação e a delta spec para o comportamento
esperado. Hoje `Patient` mistura orquestração, cabeçalho, tabela, estados
remotos e paginação; filtros, linhas, paginação e cadastro já estão separados,
mas seguem contratos próprios e não existe detalhe de paciente. A tela de
pacotes fornece o padrão visual e de interação a ser reproduzido.

O contrato confirmado no frontend é `GET /patient/list` com filtros, página e
tamanho, e `POST /patient/save` com `name` e `unitIds`. Os campos opcionais do
paciente podem ser nulos e edição/desativação não possuem contrato confirmado
neste checkout. O backend continua sendo a autoridade para tenant, unidade,
papel, status e integridade.

## Goals / Non-Goals

**Goals:**

- Fazer a rota de pacientes seguir a mesma hierarquia de resumo, filtros,
  tabela, paginação e modal usada na rota de pacotes.
- Manter a página como orquestradora de sessão, filtros aplicados, página,
  seleção, abertura de detalhe e abertura do formulário.
- Extrair somente shells visuais comprovadamente reutilizáveis para pacientes e
  pacotes, sem transferir regras de domínio para `src/components`.
- Reutilizar os primitives de tabela, diálogo, alerta, badge, skeleton e botão
  já presentes, com foco e estados remotos verificáveis.
- Preservar o contrato atual de listagem/cadastro e deixar explícita a lacuna de
  contratos para edição e desativação.

**Non-Goals:**

- Criar prontuário, histórico clínico, nova regra de status ou nova permissão.
- Simular detalhe clínico, edição ou desativação com estado local.
- Criar uma DataTable genérica com ordenação, seleção em massa ou paginação
  embutida em estado global.
- Alterar a rota `/paciente`, o isolamento de clínica/unidade ou introduzir
  dependência visual nova.

## Decisions

### Orquestração na página e componentes da feature

`Patient` manterá o estado de filtros confirmados, índice/tamanho da página,
paciente selecionado, abertura do detalhe e modo do formulário. A consulta de
listagem continuará passando pelos hooks de pacientes; catálogos de serviços,
unidades e sessão continuarão vindo dos hooks compartilhados existentes.

A feature terá componentes de apresentação equivalentes aos pacotes:

- filtro: rascunho local e callbacks de aplicar/limpar;
- tabela/linha: colunas do paciente, seleção, ações e estados de carregamento ou
  vazio;
- paginação: total, página atual e controles de limite;
- detalhe: conteúdo do paciente em modal, sem chamada inventada;
- formulário: cadastro atual em modal e estrutura preparada para edição apenas
  quando a mutation tiver contrato.

A alternativa de colocar o estado em contexto global foi descartada porque a
seleção e o detalhe pertencem à rota e isso criaria acoplamento entre features.

### Shells visuais globais

O padrão de criação de componentes globais será: componente predominantemente
visual, API tipada por propriedades/slots, sem importação de feature, sem
consulta HTTP, sem regra de autorização e com testes de acessibilidade próprios.
O componente fica na feature quando ainda houver um único consumidor.

O reuso comprovado entre pacientes e pacotes justifica extrair, ou consolidar
se já existir equivalente, os seguintes shells em `src/components`:

- `PageContainer`: fundo da área, espaçamento, largura máxima responsiva e
  proteção contra overflow da página;
- `PageHeader`: ícone/identidade, título, descrição e slot de ações;
- `DataTableCard`: superfície com borda, raio, sombra, overflow tabular e slot
  de rodapé para paginação.

Os nomes podem seguir a convenção final do módulo, mas a separação de
responsabilidades é obrigatória. `PatientTable`, `PatientDetailModal`,
`PatientFormModal` e `PatientStatusBadge` continuam específicos porque carregam
campos, contratos e linguagem do domínio. Não será criado um `Patient*` global.

### Modal e foco

Detalhe e formulário usarão o primitive `Dialog` existente, que já fornece
overlay, semântica, Escape, contenção e retorno de foco. O shell visual poderá
padronizar largura, rolagem interna, cabeçalho, descrição, fechamento e rodapé,
mas não substituirá o primitive nem fará gerenciamento manual de foco.

O detalhe receberá o item selecionado da lista e exibirá apenas dados presentes
no contrato. Se uma consulta de detalhe futura for aprovada, ela deverá ser
adicionada ao adaptador e aos estados de loading/erro antes de ser ligada à
interface.

Ao abrir o detalhe, a origem do foco será preservada. Ao fechar, filtros,
pagina, seleção e dados da tabela permanecerão; ao abrir o formulário a partir
do detalhe, os diálogos serão mutuamente exclusivos para evitar competição de
foco.

### Estrutura e estilização

A composição visual seguirá a sequência:

```text
PageContainer
└── PageHeader (resumo + ação)
    ├── filtro em superfície destacada
    └── DataTableCard
        ├── tabela mestre com overflow local
        └── paginação
```

O acabamento reutilizará as classes e tokens já presentes: fundo neutro da
página, verde de marca no ícone e cabeçalho, superfície branca, `rounded-xl`,
borda e sombra discreta; linhas terão zebra/hover/foco, avatar de iniciais e
badge com texto para status. A cor não será a única forma de comunicar status,
seleção, erro ou foco. Em telas estreitas, filtros e cabeçalho empilharão e
somente a tabela poderá rolar horizontalmente.

### Contrato e compatibilidade

O adaptador preservará os parâmetros `page`, `size`, `name`, `status` e
`serviceId`, omitindo valores vazios, e continuará normalizando a página
retornada. A criação permanecerá em `POST /patient/save`, invalidando a tag da
lista após sucesso.

O detalhe inicial não exigirá endpoint novo: usará o paciente autorizado já
retornado pela listagem. Qualquer necessidade de dados adicionais será tratada
como mudança de contrato separada. Edição e desativação só entram no fluxo
quando houver endpoint, payload, autorização, mensagens de erro e testes
definidos; até lá, controles não operacionais permanecem inativos ou ocultos.

### Verificação

Os testes da página cobrirão resumo, container, filtros, reinício da página,
linhas reais, paginação, vazio, erro recuperável, abertura por linha/botão,
conteúdo e fechamento do detalhe, foco, cadastro e invalidação da lista. Testes
dos shells globais cobrirão composição por slots, classes/atributos essenciais,
responsividade estrutural e ausência de dependência em features. Testes de
contrato manterão os parâmetros e payloads atuais.

## Risks / Trade-offs

- [O container global pode impor estilo a páginas que ainda não estão prontas]
  → extrair apenas propriedades visuais mínimas e migrar primeiro pacientes e
  pacotes com testes de renderização.
- [A tabela pode precisar de rolagem em telas pequenas] → limitar o overflow ao
  invólucro tabular e manter ações com rótulos acessíveis.
- [O item da lista pode não conter todos os dados esperados no detalhe] → usar
  marcador explícito para opcionais e não inventar valores; endpoint adicional
  exige nova decisão de contrato.
- [Dois modais podem disputar o foco] → permitir uma única abertura por vez,
  armazenar o acionador conectado ao DOM e testar a sequência detalhe → editar
  → cancelar.
- [A mudança pode conflitar com a change de modernização de pacientes ainda em
  andamento] → reconciliar tipos, endpoint único e regras de vínculo antes do
  apply; divergências de domínio viram change própria.

## Migration Plan

1. Confirmar no backend os campos atuais da listagem e a disponibilidade de
   contratos para detalhe, edição e desativação.
2. Extrair/adaptar os shells globais e migrar pacotes e pacientes sem mudar
   contratos de domínio.
3. Refatorar a composição de pacientes, mantendo o cadastro atual e adicionando
   o detalhe modal baseado na resposta da listagem.
4. Atualizar testes e README; executar lint, build, testes direcionados e
   validação estrita da change.

Rollback: restaurar a composição anterior de pacientes e manter os adaptadores
HTTP atuais; a remoção dos shells globais não exige migração de dados.

## Open Questions

- Os endpoints de detalhe, edição e desativação de paciente serão definidos em
  change própria; esta change não depende deles para habilitar a listagem e o
  detalhe com os dados já retornados.
