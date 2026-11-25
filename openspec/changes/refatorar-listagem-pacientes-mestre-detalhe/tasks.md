# Tasks

## 1. Shells visuais compartilhados

- [x] 1.1 Extrair ou consolidar `PageContainer` e `PageHeader` como componentes apresentacionais reutilizáveis por pacientes e pacotes, com API tipada por propriedades/slots e sem imports de features; verificar com testes de componente que título, descrição, ícone, ações, largura responsiva e atributos acessíveis são renderizados. Verificado com `npm run test -- src/components/__tests__/page-shell.test.tsx --run` (2 testes aprovados).
- [x] 1.2 Extrair ou consolidar `DataTableCard` para superfície, overflow tabular e slot de paginação, migrando pacientes e pacotes sem alterar seus contratos; verificar com os testes de página das duas features que tabela, estado vazio e paginação continuam presentes e que não há overflow horizontal no wrapper da página. Verificado com os testes direcionados de pacotes e pacientes (12 testes aprovados).
- [x] 1.3 Atualizar `src/components/README.md` e os READMEs das features para registrar que shells globais não consultam API, não conhecem tenant/papel e recebem estado por propriedades; verificar a documentação contra os imports reais e os testes dos componentes. Verificado com `rg` nos imports/documentação e suíte dos shells/páginas (14 testes aprovados).

## 2. Contrato e modelo da listagem de pacientes

- [x] 2.1 Confirmar os campos reais de `GET /patient/list`, mantendo `page`, `size`, `name`, `status` e `serviceId`, e ajustar tipos/normalização apenas para envelopes suportados; verificar com teste de contrato os parâmetros omitidos quando vazios, metadados e campos opcionais sem valores inventados. Verificado com normalizador paginado/legado, teste de contrato e integração (8 testes aprovados).
- [x] 2.2 Preservar `POST /patient/save` como único cadastro, com `name` e `unitIds`, invalidação da lista e regras de sessão/unidade já existentes; verificar com testes de integração ADMIN/BASIC, erro de duplicidade, escopo inválido e ausência de unidade ativa. Verificado com `patient-create.integration.test.tsx` (4 testes aprovados).
- [x] 2.3 Registrar no README de pacientes que detalhe usa os dados autorizados da listagem e que edição/desativação permanecem condicionadas a contratos próprios; verificar que nenhum adaptador dispara `POST patients` ou mutation fictícia. Verificado no README e com busca em `src/features/patients`: somente `/patient/list` e `/patient/save` são usados.

## 3. Estrutura, resumo e estilização da página

- [x] 3.1 Refatorar `Patient` para orquestrar filtros, página, seleção, abertura do detalhe e abertura do formulário dentro de `PageContainer`, `PageHeader` e `DataTableCard`; verificar com teste de página a ordem resumo → filtros → tabela → paginação e a preservação do estado ao abrir/fechar modais. Verificado na integração de pacientes com resumo, tabela/paginação, seleção e fechamento do detalhe.
- [x] 3.2 Aplicar a identidade visual alinhada aos pacotes: fundo neutro, verde de marca, cabeçalho contrastante, superfície branca, bordas arredondadas, sombra discreta, avatar por iniciais, zebra/hover/foco e status textual; verificar renderização em viewport ampla/estreita e que a cor não é a única indicação de status ou foco. Verificado por classes responsivas/overflow do `PageContainer`, estados de foco/seleção da tabela e integração de pacientes.
- [x] 3.3 Atualizar os componentes de filtro, tabela, linha e paginação para manter busca por nome, status/serviço, reinício na primeira página, total, limites, estado vazio e ações nomeadas; verificar requests, parâmetros, navegação e ausência de linhas fictícias nos testes da página. Verificado na integração de pacientes: filtros, paginação, vazio, erro recuperável e seleção por ação nomeada.

## 4. Detalhe e formulários modais

- [x] 4.1 Criar o detalhe específico de paciente usando o primitive de diálogo existente, apresentando nome, código, status, data, serviço principal/unidades quando disponíveis e marcador para ausências; verificar abertura por linha/botão, conteúdo, seleção única, Escape, fechamento e preservação de filtros/página. Verificado no teste de integração de pacientes: modal, conteúdo real, foco de abertura/fechamento e preservação da listagem.
- [x] 4.2 Migrar o cadastro atual para um formulário modal específico reutilizável, mantendo vínculo ADMIN/BASIC, validação, mensagens e foco; deixar edição desabilitada ou fora do fluxo até existir contrato HTTP aprovado; verificar submissão, cancelamento, erro e invalidação da lista. Verificado com `patient-create.integration.test.tsx` (5 testes aprovados), usando `PatientFormModal`; edição/desativação permanecem fora do fluxo.
- [x] 4.3 Garantir estados acessíveis de carregamento, erro recuperável e sucesso para listagem, catálogo, detalhe e cadastro, com foco contido e retorno ao acionador; verificar roles, mensagens live/status e sequência detalhe → formulário → cancelar nos testes RTL. Verificado nos testes de pacientes: erro/retry da lista, indisponibilidade de catálogo, detalhe acessível e foco do formulário (7 testes de página aprovados; 5 de cadastro aprovados).

## 5. Integração e qualidade

- [x] 5.1 Atualizar todos os testes afetados, builders e mocks para cobrir resumo, container, filtros, tabela, paginação, detalhe modal, cadastro e autorização sem remover lacunas documentadas; verificar a suíte direcionada de pacientes e os testes dos shells globais. Verificado com 5 arquivos direcionados e 25 testes aprovados, incluindo seleção por teclado e regressão da tela de pacotes.
- [x] 5.2 Executar `npm run lint`, `npm run build` e os testes Vitest direcionados, registrando falhas preexistentes ou bloqueios de API com a saída real; verificar que não há regressão introduzida nas features de pacientes e pacotes. Verificado: lint aprovado, build aprovado e 25 testes direcionados aprovados; apenas o aviso normal de chunk >500 kB foi emitido pelo Vite.
- [x] 5.3 Executar `openspec validate refatorar-listagem-pacientes-mestre-detalhe --strict` e revisar que proposal, spec, design, tarefas e READMEs descrevem o mesmo escopo; verificar que a change fica pronta para revisão e apply. Verificado: validação estrita aprovada e status dos artefatos consistente.

## Workflow follow-up

- Solicitar revisão dos artefatos antes de iniciar a implementação com `$openspec-apply-change`.
- Arquivar somente depois de concluir as tarefas, validar estritamente e promover o delta para `openspec/specs/legacy-patient-management/spec.md`.
