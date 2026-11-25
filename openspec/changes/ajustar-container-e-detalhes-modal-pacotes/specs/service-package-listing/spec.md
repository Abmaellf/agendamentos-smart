# Spec Delta

## Purpose

Oferece uma listagem administrativa de pacotes que aproveita a largura
disponível e permite consultar os detalhes de um pacote em um modal acessível,
sem perder o contexto da consulta atual.

## ADDED Requirements

### Requirement: A listagem de pacotes aproveita a largura disponível
Em viewports amplas, o sistema MUST usar um container de conteúdo mais largo,
mantendo margens, alinhamento e legibilidade dos filtros, tabela e paginação.

#### Scenario: Exibição em viewport ampla
- **WHEN** uma pessoa autorizada abrir a listagem em uma viewport ampla
- **THEN** o conteúdo da página MUST ocupar a área útil ampliada, com a tabela e
  suas ações visíveis sem a compressão causada por um container estreito

#### Scenario: Abertura do detalhe sem redimensionar a listagem
- **WHEN** a pessoa abrir os detalhes de um pacote
- **THEN** o container da página MUST permanecer estável e o modal MUST ser
  apresentado sobre a listagem, sem remover filtros ou paginação

#### Scenario: Adaptação em viewport estreita
- **WHEN** a mesma página for exibida em uma viewport estreita
- **THEN** o conteúdo MUST continuar legível e acessível sem criar rolagem
  horizontal na página inteira

### Requirement: O detalhe do pacote é exibido em modal
Ao selecionar um pacote ou acionar sua ação de detalhes, o sistema MUST abrir
um modal identificável com o detalhe do pacote selecionado e um controle de
fechamento explícito.

#### Scenario: Abertura pelo botão de detalhes
- **WHEN** a pessoa acionar `Detalhes` em uma linha da tabela
- **THEN** o sistema MUST abrir um elemento modal com nome acessível e título
  correspondente ao pacote selecionado

#### Scenario: Abertura pela seleção da linha
- **WHEN** a pessoa selecionar uma linha da tabela por clique ou teclado
- **THEN** o sistema MUST abrir o mesmo modal de detalhes para aquela linha,
  mantendo uma única seleção ativa

#### Scenario: Fechamento do detalhe
- **WHEN** a pessoa acionar o fechamento do modal ou a ação equivalente de
  cancelamento
- **THEN** o sistema MUST fechar o modal sem alterar o pacote e MUST manter a
  listagem na página e com os filtros atuais

### Requirement: O modal preserva o conteúdo e as ações do detalhe
O modal MUST apresentar o nome, serviço, unidade, sessões, frequência semanal,
valor total, situação, descrição quando existir, dias configurados e as ações
administrativas permitidas para o pacote.

#### Scenario: Detalhe carregado
- **WHEN** os dados do pacote selecionado estiverem disponíveis
- **THEN** o modal MUST exibir os campos do detalhe e as ações de editar e
  ativar ou desativar conforme a situação do pacote

#### Scenario: Carregamento do detalhe
- **WHEN** o detalhe ainda estiver sendo consultado
- **THEN** o modal MUST comunicar o carregamento sem apresentar o estado como
  ausência de dados

#### Scenario: Erro recuperável no detalhe
- **WHEN** a consulta do detalhe falhar
- **THEN** o modal MUST informar que o detalhe não pôde ser carregado sem
  apagar a listagem ou os filtros atuais

### Requirement: O modal mantém comportamento acessível e foco contextual
O modal MUST ter semântica de diálogo, foco contido enquanto estiver aberto e
retorno do foco ao controle que iniciou a abertura ao ser fechado.

#### Scenario: Foco ao abrir
- **WHEN** o modal de detalhes for aberto
- **THEN** o foco MUST ser movido para um controle ou conteúdo identificável
  dentro do modal

#### Scenario: Retorno do foco
- **WHEN** o modal de detalhes for fechado
- **THEN** o foco MUST retornar ao botão ou linha que iniciou a abertura, quando
  esse elemento ainda estiver disponível
