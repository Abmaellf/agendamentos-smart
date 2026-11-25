# Tasks

## 1. Contrato paginado e modelo da consulta

- [x] 1.1 Confirmar com a API irmã o envelope paginado, a indexação de `page`, o parâmetro `size` e os nomes dos metadados; registrar no README/PR a correspondência com o contrato real e o bloqueio caso a API ainda não ofereça paginação.
- [x] 1.2 Criar o tipo normalizado da página de pacotes e atualizar o adaptador de listagem para enviar página, tamanho e filtros sem valores vazios; verificar com teste de contrato os parâmetros gerados e a resposta paginada.
- [x] 1.3 Implementar o normalizador compatível com resposta paginada, array e `{ content }`, sem fatiar a coleção no cliente; verificar testes unitários para metadados válidos, coleção legada e coleção vazia.

## 2. Componentes reutilizáveis da listagem

- [x] 2.1 Extrair o componente de filtros de pacotes com rascunho local, aplicação, limpeza e controles para nome, unidade, serviço, situação e sessões; verificar teste de componente para callbacks e reinício esperado da página.
- [x] 2.2 Criar o componente de tabela de pacotes com cabeçalhos semânticos, seleção de linha, colunas administrativas e ações nomeadas; verificar teste para resultados, estado vazio, seleção única e ausência de cards.
- [x] 2.3 Criar o componente de paginação baseado nos metadados normalizados, incluindo total, página atual e controles primeiro/anterior/próximo/último; verificar teste dos limites e callbacks de navegação.
- [x] 2.4 Atualizar o README da feature `packages` descrevendo os componentes, o contrato paginado, o fallback legado e os estados da listagem; verificar que os endpoints, limitações e exemplos documentados correspondem ao código/testes.

## 3. Composição mestre-detalhe e modal de pacote

- [x] 3.1 Extrair o detalhe contextual do pacote, mantendo descrição, dias, frequência, preço, situação e ações existentes; verificar teste para seleção, troca, fechamento e estado de carregamento/erro do detalhe.
- [x] 3.2 Extrair o formulário existente para um modal único de criação/edição, preservando schema, mensagens, catálogo de unidades/serviços e mutations; verificar testes para abertura vazia, edição pré-preenchida, cancelamento, validação e submissão.
- [x] 3.3 Reestruturar `PackagesPage` para orquestrar filtros aplicados, página, seleção e modo do modal, com container amplo e layout lateral/empilhado responsivo; verificar teste de integração para manter filtros/página ao abrir e fechar detalhe/modal.
- [x] 3.4 Preservar autorização ADMIN, status, invalidação de cache e mensagens de erro das mutations sem alterar contratos de domínio; verificar os testes existentes de criação, edição, ativação/desativação e acesso BASIC após a refatoração.

## 4. Acessibilidade e integração visual

- [x] 4.1 Aplicar nomes acessíveis, estado selecionado, foco contido/retornado no modal e anúncios de carregamento/erro; verificar testes RTL com roles, labels, foco e mensagens de status.
- [x] 4.2 Validar o comportamento em viewport ampla e estreita, permitindo overflow somente no contêiner da tabela quando necessário e evitando overflow horizontal do layout; verificar revisão visual/manual e os testes responsivos disponíveis. Evidência: inspeção dos breakpoints e `git diff --check`; preview visual não foi possível porque não há navegador disponível nesta sessão.
- [x] 4.3 Atualizar documentação transversal somente se a composição da rota ou o padrão de módulo mudar; verificar links e ausência de alterações em rotas, permissões e fluxo de contratação.

## 5. Verificação da change

- [x] 5.1 Executar os testes unitários e de integração afetados da feature de pacotes, incluindo contrato, paginação, filtros, tabela, mestre-detalhe, modal e regressões; registrar os comandos e resultados reais.
- [x] 5.2 Executar `npm run lint` e `npm run build`, corrigindo falhas introduzidas e separando qualquer falha preexistente comprovada; registrar a evidência no acompanhamento da change.
- [x] 5.3 Executar `openspec validate refatorar-listagem-pacotes-mestre-detalhe --strict` e confirmar que proposal, spec, design e tasks permanecem coerentes antes de solicitar aplicação/arquivamento.

## Workflow follow-up

- Implementar esta change somente após revisão dos artefatos e solicitação explícita do fluxo de aplicação.
- Arquivar a change somente depois de concluir as tarefas, validar estritamente e confirmar a atualização da spec principal correspondente.
