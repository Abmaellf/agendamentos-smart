# Spec Delta

## MODIFIED Requirements

### Requirement: A tela carrega e lista pacientes legados

A rota `/paciente` MUST solicitar a coleção paginada autorizada pela API ao iniciar e MUST renderizar uma linha por paciente retornado, usando os dados do contrato em vez de valores fixos no cliente.

#### Scenario: Listagem inicial

- **WHEN** a tela de pacientes for montada e a API responder com conteúdo
- **THEN** a tabela MUST apresentar uma linha por item retornado e MUST refletir o código, nome, status e data de cadastro fornecidos pela API

#### Scenario: Página sem pacientes

- **WHEN** a API responder com uma página vazia
- **THEN** a interface MUST mostrar um estado vazio compreensível e MUST informar zero itens, sem exibir linhas fictícias

#### Scenario: Campo não disponível no contrato

- **WHEN** a resposta não fornecer um campo opcional usado pela referência visual, como serviço principal
- **THEN** a interface MUST comunicar a ausência ou usar o marcador definido pelo contrato, sem inventar serviço, status, código ou data

#### Scenario: Paginação da listagem

- **WHEN** a pessoa avançar ou retornar uma página disponível
- **THEN** a interface MUST solicitar a página correspondente e MUST atualizar linhas, total e indicador de página com os metadados retornados pela API

### Requirement: O filtro atual recarrega a fonte de pacientes

O formulário de filtro MUST apresentar busca por nome, status e serviço, permitir limpar os critérios e MUST aplicar somente critérios suportados pelo contrato da API ou pela própria coleção autorizada.

#### Scenario: Filtro submetido

- **WHEN** a pessoa submeter um ou mais filtros válidos
- **THEN** a interface MUST solicitar ou calcular a listagem filtrada sem ampliar o escopo de clínica ou unidade da sessão e MUST retornar à primeira página

#### Scenario: Limpeza dos filtros

- **WHEN** a pessoa acionar “Limpar filtros”
- **THEN** os campos MUST voltar ao estado inicial e a listagem MUST retornar à primeira página da coleção autorizada

#### Scenario: Filtro não suportado pelo backend

- **WHEN** um critério visual ainda não tiver contrato de consulta correspondente
- **THEN** a implementação MUST incluir a decisão no contrato antes de apresentá-lo como filtro funcional e MUST não simular resultados incorretos

### Requirement: O checkout contém fluxos legados distintos de criação

O cadastro da tela MUST usar exclusivamente `POST /patient/save`, com `name` e `unitIds` não vazio; o fluxo legado `POST patients` MUST deixar de ser executável pela rota `/paciente`.

#### Scenario: ADMIN cadastra paciente em unidades autorizadas

- **WHEN** uma pessoa com papel `ADMIN` informar nome válido e uma ou mais unidades da própria clínica
- **THEN** a aplicação MUST enviar `unitIds` no payload, a API MUST persistir o paciente na clínica da sessão e nas unidades autorizadas e a listagem MUST ser atualizada após sucesso

#### Scenario: BASIC cadastra paciente na unidade ativa

- **WHEN** uma pessoa com papel `BASIC` informar nome válido
- **THEN** a aplicação MUST usar `activeUnitId` como única unidade do cadastro e a API MUST aceitar o cadastro somente nessa unidade da clínica autenticada

#### Scenario: Dados obrigatórios ausentes

- **WHEN** o nome estiver vazio ou o payload não contiver `unitIds` não vazio
- **THEN** o cadastro MUST ser impedido e a interface MUST apresentar os campos que precisam ser corrigidos

#### Scenario: Unidade ou clínica fora do escopo

- **WHEN** a solicitação contiver unidade de outra clínica, unidade não autorizada ou `clinicId` divergente da sessão
- **THEN** a API MUST rejeitar a solicitação, MUST não persistir o paciente e a interface MUST comunicar erro de escopo sem expor dados de outra clínica

#### Scenario: Cadastro duplicado

- **WHEN** a API rejeitar o nome por duplicidade
- **THEN** a interface MUST informar que o paciente já existe e MUST preservar o formulário para correção ou cancelamento

#### Scenario: Planejamento de mudança no cadastro

- **WHEN** uma change tocar a criação de pacientes
- **THEN** ela MUST escolher explicitamente `POST /patient/save` como contrato alvo, cobrir o fluxo legado afetado e registrar sua remoção da rota executável

### Requirement: Ações de gestão não são declaradas como entregues

Os controles de detalhe, edição e desativação MUST somente iniciar operações de domínio quando houver contrato HTTP, autorização e callback implementados; o detalhe visual poderá ser aberto com os dados autorizados já disponíveis na listagem.

#### Scenario: Detalhe disponível na listagem

- **WHEN** a pessoa selecionar um paciente retornado pela API
- **THEN** a interface MUST permitir consultar seus dados disponíveis em um modal sem alterar filtros, paginação ou cadastro

#### Scenario: Ação de edição ou desativação sem contrato

- **WHEN** não existir contrato implementado para editar ou desativar o paciente
- **THEN** a interface MUST impedir a requisição fictícia e MUST comunicar a indisponibilidade ou manter a ação fora do fluxo

#### Scenario: Ação de gestão implementada

- **WHEN** existir contrato HTTP e autorização aprovados para uma ação de edição ou desativação
- **THEN** a interface MUST usar a operação real, tratar sucesso e erro e MUST atualizar a listagem sem ampliar o escopo autorizado

#### Scenario: Avaliação da tela de pacientes

- **WHEN** a capacidade de pacientes for inventariada
- **THEN** controles sem operação de domínio MUST ser registrados como não implementados e não podem aparentar sucesso

## ADDED Requirements

### Requirement: A página de pacientes apresenta um resumo administrativo

A rota `/paciente` MUST apresentar título, descrição da área, identificação visual e uma ação de cadastro coerentes com a operação de pacientes.

#### Scenario: Abertura da página

- **WHEN** uma pessoa autorizada abrir `/paciente`
- **THEN** a interface MUST mostrar o resumo da área antes dos filtros e MUST manter a ação de novo paciente acessível

#### Scenario: Ação de novo paciente

- **WHEN** a pessoa acionar a ação de novo paciente
- **THEN** a interface MUST abrir o formulário de cadastro sem remover os filtros, a página ou a listagem já exibida

### Requirement: A listagem usa uma estrutura responsiva de tabela

A tela MUST organizar filtros, tabela e paginação em um container amplo e responsivo, sem causar rolagem horizontal na página inteira.

#### Scenario: Viewport ampla

- **WHEN** a listagem for exibida em uma viewport ampla
- **THEN** filtros, tabela e paginação MUST aproveitar a área útil com margens e legibilidade preservadas

#### Scenario: Viewport estreita

- **WHEN** a listagem for exibida em uma viewport estreita
- **THEN** os controles MUST permanecer acessíveis e eventual overflow MUST ficar restrito ao conteúdo tabular, sem deslocar a página inteira

#### Scenario: Estrutura visual dos resultados

- **WHEN** houver pacientes retornados
- **THEN** a tabela MUST usar cabeçalhos semânticos, linhas diferenciadas por estado de interação e ações nomeadas, sem depender somente de cor para comunicar informação

### Requirement: O detalhe do paciente é exibido em modal

Ao selecionar um paciente ou acionar sua ação de detalhe, o sistema MUST abrir um modal acessível com os dados disponíveis e fechamento explícito.

#### Scenario: Abertura do detalhe

- **WHEN** a pessoa selecionar uma linha ou acionar “Detalhes”
- **THEN** a interface MUST abrir um diálogo identificado pelo paciente e MUST manter a listagem visível como contexto subjacente

#### Scenario: Conteúdo do detalhe

- **WHEN** o detalhe estiver disponível
- **THEN** o modal MUST apresentar no mínimo nome, código, status, data de cadastro e serviço principal ou marcador de ausência, além de unidades quando fornecidas pelo contrato

#### Scenario: Fechamento do detalhe

- **WHEN** a pessoa fechar o modal, pressionar Escape ou cancelar
- **THEN** o modal MUST ser fechado sem alteração de dados e a listagem MUST preservar filtros, página e seleção atual

### Requirement: Os modais preservam foco e estados remotos

Os fluxos de detalhe e cadastro MUST comunicar carregamento, erro e sucesso de forma acessível e MUST preservar o foco contextual ao abrir e fechar.

#### Scenario: Carregamento ou falha

- **WHEN** a listagem, detalhe ou catálogo necessário estiver carregando ou falhar
- **THEN** a interface MUST comunicar o estado sem tratá-lo como lista vazia e MUST oferecer tentativa novamente quando a operação for recuperável

#### Scenario: Foco do modal

- **WHEN** um modal de detalhe ou cadastro for aberto e depois fechado
- **THEN** o foco MUST ficar contido em um controle identificável do modal e MUST retornar ao acionador quando ele ainda estiver disponível

#### Scenario: Sucesso do cadastro

- **WHEN** o cadastro for concluído pela API
- **THEN** o modal MUST fechar, a listagem MUST ser invalidada ou atualizada e filtros e paginação MUST permanecer coerentes com a nova consulta

