# Spec Delta

## MODIFIED Requirements

### Requirement: Criação manual carrega catálogos necessários

O diálogo de criação MUST carregar pacientes, unidades e serviços antes do envio e MUST buscar profissionais filtrados pelo serviço selecionado, mantendo o profissional opcional. Os quatro catálogos MUST ser apresentados em campos que permitam localizar e selecionar uma opção por busca textual.

#### Scenario: Serviço selecionado

- **WHEN** a pessoa selecionar um serviço
- **THEN** o formulário MUST preencher duração e preço padrão e consultar os profissionais daquele serviço

#### Scenario: Catálogos carregados antes da interação

- **WHEN** o diálogo for aberto
- **THEN** pacientes, unidades e serviços MUST estar disponíveis para seleção após o carregamento, e profissionais MUST permanecer condicionados ao serviço selecionado

## ADDED Requirements

### Requirement: Campos de catálogo permitem busca textual no dropdown

Paciente, unidade, serviço e profissional MUST permitir busca parcial pelo nome exibido, com filtro local e sem nova chamada HTTP a cada caractere digitado.

#### Scenario: Abrir um campo pesquisável

- **WHEN** a pessoa abrir um dos quatro campos de catálogo
- **THEN** o dropdown MUST exibir uma área de busca com uma lupa visível, as opções disponíveis e o valor atualmente selecionado, quando houver

#### Scenario: Filtrar por trecho do nome

- **WHEN** a pessoa digitar um trecho no campo de busca
- **THEN** o dropdown MUST exibir somente as opções cujo nome contenha o trecho, ignorando diferenças de maiúsculas, minúsculas e acentuação, sem alterar os demais catálogos

#### Scenario: Busca sem correspondência

- **WHEN** o texto digitado não corresponder ao nome de nenhuma opção
- **THEN** o dropdown MUST informar que nenhuma opção foi encontrada e MUST impedir a seleção de uma opção inexistente

#### Scenario: Limpar a busca

- **WHEN** a pessoa apagar todo o texto de busca
- **THEN** o dropdown MUST restaurar todas as opções disponíveis do catálogo, preservando o valor já selecionado

#### Scenario: Selecionar uma opção filtrada

- **WHEN** a pessoa escolher uma opção exibida pelo filtro
- **THEN** o campo MUST mostrar o nome selecionado, armazenar o identificador correspondente no formulário e fechar o dropdown

#### Scenario: Profissional depende do serviço

- **WHEN** nenhum serviço estiver selecionado
- **THEN** o campo de profissional MUST permanecer desabilitado e informar a ausência de opções até que um serviço seja selecionado

- **WHEN** a pessoa trocar o serviço
- **THEN** o campo de profissional MUST limpar a seleção anterior, carregar somente os profissionais do novo serviço e manter a opção “Sem profissional”

### Requirement: Campos pesquisáveis preservam o contrato do FormField

Cada campo pesquisável MUST continuar associado ao rótulo e ao erro do `FormField`, MUST expor um nome acessível correspondente ao rótulo e MUST manter o foco e a navegação por teclado utilizáveis.

#### Scenario: Campo sem seleção

- **WHEN** o formulário for exibido sem um paciente, unidade ou serviço selecionado
- **THEN** o controle MUST anunciar o rótulo do `FormField`, exibir o placeholder “Selecione” e indicar programaticamente que o dropdown está fechado

#### Scenario: Campo opcional sem profissional

- **WHEN** o campo de profissional estiver habilitado e sem seleção
- **THEN** o controle MUST exibir e anunciar “Sem profissional” como opção válida, sem apresentar erro de obrigatoriedade

#### Scenario: Validação de campo obrigatório

- **WHEN** a pessoa enviar o formulário sem paciente, unidade ou serviço
- **THEN** o erro correspondente MUST permanecer associado ao controle pelo `aria-describedby`, o diálogo MUST permanecer aberto e o foco MUST ir para o primeiro campo inválido

#### Scenario: Navegação por teclado

- **WHEN** a pessoa operar um campo pesquisável somente pelo teclado
- **THEN** MUST ser possível abrir o dropdown, digitar a busca, percorrer as opções, selecionar uma opção e fechá-lo sem perder o nome acessível, usando Enter, Espaço, setas, Escape e Tab conforme o estado do controle

#### Scenario: Fechar sem confirmar nova opção

- **WHEN** a pessoa fechar o dropdown por Escape ou clicar fora sem escolher uma nova opção
- **THEN** o campo MUST conservar a seleção anterior e o formulário MUST conservar o identificador anteriormente armazenado
