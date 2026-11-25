# Proposal

## Why

A tela de pacotes atualmente mistura cadastro inline, filtros e uma coleção em
cards, dificultando a comparação de registros e a leitura do detalhe de um
pacote. A mudança organiza a experiência no padrão mestre-detalhe, com uma
listagem tabular paginada como ponto de entrada e ações de cadastro isoladas em
modal.

## What Changes

- Reorganizar a tela de pacotes em um layout administrativo mais amplo e
  responsivo, preservando a rota e as permissões atuais.
- Exibir filtros em um componente próprio antes da listagem, com aplicação e
  limpeza explícitas e reinício da paginação ao alterar os critérios.
- Substituir os cards por uma DataTable reutilizável para exibir nome, serviço,
  unidade, sessões, frequência, preço, situação e ações do pacote.
- Adicionar paginação controlada, com estado de carregamento, total de
  registros, navegação entre páginas e estado vazio compatível com os filtros.
- Exibir o detalhe do pacote selecionado no padrão mestre-detalhe: painel
  contextual ao lado da tabela em telas largas e abaixo dela em telas estreitas.
- Mover o formulário de criação para um modal acionado por um botão acima da
  listagem; reutilizar o mesmo contrato visual para edição, com os dados do
  pacote selecionado pré-preenchidos.
- Extrair filtros, tabela, paginação, detalhe e modal para componentes da
  feature, mantendo regras de negócio, validação, autorização e mutations nos
  contratos existentes.
- Ajustar o contrato de consulta para aceitar paginação e preservar os filtros
  administrativos existentes; **BREAKING** somente se a API não mantiver a
  compatibilidade com a forma atual de consulta sem parâmetros de página.

Fora de escopo: novos campos ou regras de pacote, contratação/agendamento por
pacote, alteração de permissões, exclusão física, mudança de rota e refatoração
de componentes de outros domínios.

## Capabilities

### New Capabilities

- `service-package-listing`: permite consultar e administrar visualmente o
  catálogo de pacotes no padrão mestre-detalhe, com filtros, tabela paginada,
  detalhe contextual e modais de criação/edição.

### Modified Capabilities

- Nenhuma capability promovida em `openspec/specs/` cobre atualmente a
  listagem de pacotes. A change ativa `gerenciar-pacotes-flexiveis` será
  considerada durante a implementação para manter os contratos de gestão
  compatíveis, mas não será alterada por esta proposta.

## Impact

- Frontend: `src/features/packages/pages/packages-page.tsx`, novos componentes
  da feature, testes de página/integração, README do módulo e componentes UI
  compartilhados somente quando a abstração for realmente reutilizável.
- API/adaptador: consulta `GET /api/service-packages` deverá transportar
  `page`, `size` e filtros existentes e retornar metadados de paginação sem
  perder o conteúdo; o detalhe continuará usando
  `GET /api/service-packages/{id}`.
- UX/acessibilidade: tabela com cabeçalhos semânticos, ações nomeadas,
  foco/fechamento de modal e comportamento responsivo sem rolagem horizontal
  causada pelo layout da página.
- Dados, autorização, tenant, unidade, status e regras de imutabilidade
  permanecem sob os contratos já definidos pela gestão de pacotes e pela API;
  o frontend não se torna autoridade dessas regras.
