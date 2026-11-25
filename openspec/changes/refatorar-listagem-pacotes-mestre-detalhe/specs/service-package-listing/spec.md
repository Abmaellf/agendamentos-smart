# Spec Delta

## Purpose

Oferece uma consulta administrativa de pacotes organizada para localizar,
comparar e inspecionar registros com eficiência, usando filtros, tabela
paginada e detalhe contextual sem alterar as regras de domínio dos pacotes.

## ADDED Requirements

### Requirement: A tela de pacotes apresenta uma área mestre-detalhe responsiva
O sistema MUST apresentar a listagem como área mestre e o pacote selecionado como detalhe contextual, usando um container amplo em telas grandes e uma composição empilhada em telas estreitas sem ocultar dados ou ações essenciais.

#### Scenario: Exibição em viewport ampla
- **WHEN** uma pessoa autorizada abrir a tela de pacotes em uma viewport ampla
- **THEN** o sistema MUST exibir a tabela e o detalhe selecionado em uma composição lado a lado, aproveitando a largura disponível sem esticar o conteúdo de forma ilegível

#### Scenario: Exibição em viewport estreita
- **WHEN** a mesma tela for aberta em uma viewport estreita
- **THEN** o sistema MUST empilhar a tabela e o detalhe, mantendo filtros, ações, leitura dos dados e fechamento do detalhe acessíveis sem rolagem horizontal da página

### Requirement: A listagem mestre usa tabela paginada
O sistema MUST exibir os pacotes em uma tabela com cabeçalhos semânticos e paginação controlada, substituindo a apresentação principal em cards.

#### Scenario: Tabela com resultados
- **WHEN** a consulta retornar pacotes
- **THEN** a tabela MUST apresentar no mínimo nome, serviço, unidade, total de sessões, frequência semanal, preço, situação e ações disponíveis

#### Scenario: Navegação para outra página
- **WHEN** a pessoa solicitar a próxima, anterior, primeira ou última página disponível
- **THEN** o sistema MUST consultar e exibir somente os registros daquela página, informar a página atual e o total de registros, e desabilitar os controles que não se aplicam

#### Scenario: Nenhum resultado
- **WHEN** a consulta não encontrar pacotes para os filtros aplicados
- **THEN** o sistema MUST exibir um estado vazio associado à listagem e orientar a ajustar os filtros ou cadastrar um pacote, sem renderizar cards como alternativa

### Requirement: Filtros controlam a consulta da listagem
O sistema MUST oferecer filtros administrativos existentes para nome, unidade, serviço, situação e total de sessões, com ações explícitas para aplicar e limpar os critérios.

#### Scenario: Aplicação de filtros
- **WHEN** a pessoa preencher um ou mais filtros e solicitar a filtragem
- **THEN** o sistema MUST consultar a listagem com todos os critérios preenchidos e retornar à primeira página

#### Scenario: Limpeza de filtros
- **WHEN** a pessoa solicitar a limpeza dos filtros
- **THEN** o sistema MUST remover os critérios aplicados, retornar à primeira página e recarregar a listagem sem esses parâmetros

### Requirement: A seleção de um pacote abre seu detalhe contextual
O sistema MUST permitir selecionar um pacote da tabela e apresentar seu detalhe completo, incluindo descrição quando existir, dias configurados, frequência, preço, situação e ações autorizadas.

#### Scenario: Seleção de pacote
- **WHEN** a pessoa selecionar uma linha ou a ação de detalhe de um pacote
- **THEN** o sistema MUST destacar o registro mestre e apresentar o detalhe correspondente sem perder os filtros e a página atuais

#### Scenario: Troca de seleção
- **WHEN** a pessoa selecionar outro pacote na página atual
- **THEN** o sistema MUST atualizar o detalhe para o novo pacote e manter uma única seleção ativa

#### Scenario: Fechamento do detalhe
- **WHEN** a pessoa fechar ou limpar a seleção
- **THEN** o sistema MUST ocultar o detalhe contextual e manter a listagem na mesma página e com os mesmos filtros

### Requirement: Criação e edição são iniciadas por modal
O sistema MUST disponibilizar acima da listagem um botão para criar pacote e MUST abrir o formulário em modal; a edição MUST reutilizar esse fluxo com os dados do pacote selecionado pré-preenchidos.

#### Scenario: Abrir criação
- **WHEN** a pessoa autorizada acionar o botão de novo pacote
- **THEN** o sistema MUST abrir um modal identificável, com formulário vazio e foco inicial dentro do modal, sem remover a listagem do estado atual

#### Scenario: Abrir edição
- **WHEN** a pessoa acionar editar no detalhe ou na linha de um pacote
- **THEN** o sistema MUST abrir o modal com os dados atuais do pacote e identificar que a operação é uma edição

#### Scenario: Cancelar modal
- **WHEN** a pessoa fechar ou cancelar o modal sem salvar
- **THEN** o sistema MUST fechar o modal sem criar ou alterar pacote e MUST preservar a página, os filtros e a seleção atual

#### Scenario: Salvar com sucesso
- **WHEN** a pessoa concluir validamente a criação ou edição
- **THEN** o sistema MUST fechar o modal, atualizar a consulta respeitando os filtros atuais e manter as regras de autorização, validação e imutabilidade da gestão de pacotes

### Requirement: A consulta paginada preserva filtros e metadados
O contrato de consulta MUST aceitar os filtros administrativos existentes junto de parâmetros de página e tamanho e MUST retornar conteúdo e metadados suficientes para navegar e informar o total da consulta.

#### Scenario: Consulta de página filtrada
- **WHEN** o cliente solicitar uma página com filtros de nome, unidade, serviço, situação ou sessões
- **THEN** a API MUST aplicar os critérios em conjunto e retornar a página solicitada com índice, tamanho, total de registros, total de páginas e indicação de última página

#### Scenario: Compatibilidade da consulta sem filtros
- **WHEN** o cliente solicitar a primeira página sem filtros opcionais
- **THEN** a API MUST retornar uma resposta paginada válida, mesmo que a implementação anterior aceitasse uma consulta sem parâmetros de página, sem alterar os dados dos pacotes

### Requirement: Estados remotos e ações são comunicados de forma acessível
O sistema MUST comunicar carregamento inicial, atualização de página, erro recuperável, ausência de resultados e ações disponíveis por texto e controles acessíveis.

#### Scenario: Carregamento da listagem
- **WHEN** a listagem estiver buscando dados
- **THEN** o sistema MUST comunicar que os pacotes estão sendo carregados e MUST evitar que a pessoa interprete o estado parcial como uma lista vazia

#### Scenario: Falha recuperável
- **WHEN** a consulta falhar
- **THEN** o sistema MUST exibir uma mensagem de erro compreensível e uma ação para tentar novamente sem apagar os filtros aplicados

#### Scenario: Modal aberto
- **WHEN** o modal de criação ou edição estiver aberto
- **THEN** o sistema MUST fornecer nome acessível, foco contido no modal e retorno do foco ao controle que o abriu após o fechamento
