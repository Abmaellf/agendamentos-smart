# Spec Delta

## MODIFIED Requirements

### Requirement: A tela carrega e lista pacientes legados

A rota `/paciente` MUST solicitar a coleção paginada autorizada pela API ao iniciar e MUST renderizar uma linha por paciente retornado, usando os dados do contrato em vez de valores fixos no cliente.

#### Scenario: Listagem inicial

- **WHEN** a tela de pacientes for montada e a API responder com conteúdo
- **THEN** a tabela MUST apresentar uma linha para cada item retornado e MUST refletir o código, nome, status e data de cadastro fornecidos pela API

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
- **THEN** a interface MUST solicitar ou calcular a listagem filtrada sem ampliar o escopo de clínica ou unidade da sessão

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

Os controles de detalhe, edição e desativação MUST somente iniciar operações quando houver contrato HTTP e callback de domínio implementados; enquanto isso, a interface MUST distingui-los como indisponíveis ou mantê-los fora da listagem.

#### Scenario: Avaliação da tela de pacientes

- **WHEN** a capacidade de pacientes for inventariada
- **THEN** controles sem operação de domínio MUST ser registrados como não implementados e não podem aparentar sucesso

#### Scenario: Ação ainda não implementada

- **WHEN** a pessoa visualizar uma ação sem endpoint implementado
- **THEN** a interface MUST impedir o envio de uma requisição fictícia e MUST comunicar que a ação ainda não está disponível

## ADDED Requirements

### Requirement: A listagem usa uma identidade visual colorida e acessível

A rota `/paciente` MUST apresentar a hierarquia visual da referência fornecida, com cores de marca, card/tabela com bordas arredondadas, cabeçalho contrastante, avatar por iniciais, chips de status e estados acessíveis de foco, carregamento, erro e vazio.

#### Scenario: Renderização da listagem modernizada

- **WHEN** a API responder com pacientes
- **THEN** a tela MUST mostrar título e descrição da área, ação destacada de novo paciente, barra de filtros, cabeçalho contrastante e linhas visualmente diferenciadas sem depender apenas de cor

#### Scenario: Status visual

- **WHEN** um paciente possuir status suportado pelo contrato
- **THEN** a interface MUST renderizar um rótulo textual e uma indicação visual consistente para esse status, incluindo alternativa legível por tecnologia assistiva

#### Scenario: Estado de carregamento, erro ou vazio

- **WHEN** a consulta estiver carregando, falhar ou retornar zero registros
- **THEN** a interface MUST comunicar o estado no conteúdo principal e MUST manter os controles de recuperação ou cadastro utilizáveis

### Requirement: O cadastro respeita o vínculo entre paciente, clínica e unidade

O sistema MUST derivar a clínica da identidade autenticada e MUST aceitar somente unidades pertencentes à mesma clínica; o cliente não pode ser a autoridade para ampliar esse escopo.

#### Scenario: Vínculo válido

- **WHEN** o payload contiver unidades pertencentes à clínica autenticada
- **THEN** o paciente MUST ser persistido com a clínica do principal e com os vínculos de unidade informados que estejam autorizados

#### Scenario: Vínculo entre clínicas diferentes

- **WHEN** uma unidade informada pertencer a outra clínica
- **THEN** a API MUST rejeitar a criação antes da persistência e MUST retornar um erro de recurso/escopo estável

#### Scenario: Sessão BASIC sem unidade ativa válida

- **WHEN** a sessão `BASIC` não fornecer uma `activeUnitId` válida ou a unidade não estiver no catálogo autorizado
- **THEN** a interface MUST bloquear o cadastro e MUST informar que uma unidade autorizada não está disponível
