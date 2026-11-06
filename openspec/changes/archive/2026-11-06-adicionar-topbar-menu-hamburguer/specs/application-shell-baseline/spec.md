# Spec Delta

## MODIFIED Requirements

### Requirement: Áreas autenticadas usam a casca visual comum

As rotas de agenda, pacientes, profissional e configuração MUST usar o layout interno compartilhado. Esse layout MUST apresentar um topbar compartilhado acima do conteúdo e a navegação principal em um menu lateral: persistente ao lado do conteúdo em telas amplas e em painel lateral acionável em telas compactas. Login e cadastro MUST continuar usando o layout de autenticação.

#### Scenario: Entrada na agenda

- **WHEN** a rota `/appointments` for renderizada
- **THEN** a página MUST ser composta dentro do layout interno da aplicação, com o topbar compartilhado disponível

#### Scenario: Área interna em tela ampla

- **WHEN** uma pessoa acessar uma rota interna em uma tela ampla
- **THEN** o topbar MUST permanecer visível acima do conteúdo, o conteúdo MUST permanecer visível ao lado do menu lateral persistente e a navegação horizontal legada MUST não ser exibida

#### Scenario: Área interna em tela compacta

- **WHEN** uma pessoa acessar uma rota interna em uma tela compacta
- **THEN** o topbar MUST permanecer acessível com um controle hamburger nomeado para abrir o painel lateral, sem impedir a leitura ou interação com o conteúdo

#### Scenario: Fechamento do painel compacto

- **WHEN** o painel lateral compacto estiver aberto e a pessoa acionar seu controle de fechamento ou a tecla Escape
- **THEN** o painel MUST fechar e devolver o foco ao controle hamburger que o abriu

## ADDED Requirements

### Requirement: O topbar apresenta as ações globais da referência

O topbar das rotas internas MUST apresentar busca, navegação de data, ação de agendamento quando disponível, notificações e acesso ao perfil, com nomes acessíveis e sem sobrepor o conteúdo em telas amplas ou compactas.

#### Scenario: Exibição das ações do topbar

- **WHEN** uma rota interna for renderizada
- **THEN** o topbar MUST exibir um campo de busca, o controle “Hoje”, a data corrente, controles de período anterior e próximo, o controle de notificações e o controle de perfil; o botão “Agendar” MUST ser exibido quando o fluxo de agendamento estiver disponível para a sessão

#### Scenario: Ações do topbar em viewport estreita

- **WHEN** o topbar for renderizado em uma viewport estreita
- **THEN** seus controles MUST permanecer utilizáveis, com agrupamento ou ocultação responsiva que não crie rolagem horizontal nem cubra o conteúdo principal

### Requirement: O controle hamburger governa a navegação lateral

O topbar MUST oferecer um único controle hamburger nomeado para alternar a navegação lateral conforme o espaço disponível, comunicando seu estado por tecnologia assistiva.

#### Scenario: Recolher a navegação em tela ampla

- **WHEN** uma pessoa ativar o controle hamburger em uma tela ampla com a sidebar expandida
- **THEN** a sidebar MUST ser recolhida para o estado compacto de ícones, o conteúdo MUST ocupar o espaço liberado e o controle MUST informar que a navegação pode ser expandida

#### Scenario: Expandir a navegação em tela ampla

- **WHEN** uma pessoa ativar o controle hamburger em uma tela ampla com a sidebar recolhida
- **THEN** a sidebar MUST ser expandida novamente, mantendo a rota atual e os rótulos da navegação disponíveis

#### Scenario: Abrir a navegação em tela compacta

- **WHEN** uma pessoa ativar o controle hamburger em uma tela compacta
- **THEN** o painel lateral MUST abrir como diálogo nomeado, com foco e rolagem de fundo tratados conforme a casca responsiva existente

### Requirement: A navegação temporal do topbar controla a data visível

O topbar MUST exibir a data corrente em pt-BR, oferecer um controle “Hoje” e permitir avançar ou retroceder o período semanal sem alterar a URL ou criar uma rota.

#### Scenario: Voltar para hoje

- **WHEN** uma pessoa ativar o controle “Hoje”
- **THEN** a data compartilhada da casca MUST voltar para a data atual e a data apresentada MUST ser atualizada em pt-BR

#### Scenario: Navegar entre períodos

- **WHEN** uma pessoa ativar o controle de período anterior ou próximo
- **THEN** a data compartilhada MUST retroceder ou avançar sete dias, respectivamente, e a agenda MUST refletir o novo período quando a pessoa estiver na rota `/appointments`

#### Scenario: Escolher uma data pelo controle textual

- **WHEN** uma pessoa ativar a data apresentada e selecionar uma data válida
- **THEN** a data compartilhada MUST assumir o valor selecionado e a agenda MUST refletir a semana correspondente quando estiver disponível

### Requirement: A busca do topbar é identificável e não inventa um contrato de pesquisa

O topbar MUST apresentar um campo de busca com o texto “Buscar paciente, serviço ou horário...” e indicação visual do atalho `⌘ K`. Esta change MUST garantir apenas a entrada e a identificação acessível do campo, sem exigir endpoint ou resultado de busca global.

#### Scenario: Identificar o campo de busca

- **WHEN** uma pessoa navegar pelos controles do topbar
- **THEN** encontrará um campo com nome acessível de busca e o placeholder “Buscar paciente, serviço ou horário...”

#### Scenario: Informar um termo de busca

- **WHEN** uma pessoa digitar um termo no campo de busca
- **THEN** o campo MUST conservar o valor digitado sem alterar a rota ou iniciar uma requisição não definida por esta capability

### Requirement: Perfil e notificações são acessíveis no topbar

O topbar MUST apresentar um controle de notificações e um controle de perfil com avatar, identificação disponível da conta e indicador visual de expansão. O indicador de notificações não pode ser tratado como fonte de autorização ou dado remoto novo nesta change.

#### Scenario: Acessar o menu de perfil

- **WHEN** uma pessoa ativar o controle de avatar ou perfil
- **THEN** a aplicação MUST abrir o menu de conta existente com a identificação disponível do perfil e sem exigir uma nova rota de perfil

#### Scenario: Identificar notificações

- **WHEN** o topbar for renderizado
- **THEN** o controle de notificações MUST ter nome acessível e, quando houver uma contagem de não lidas fornecida pela interface, MUST exibir essa contagem em um indicador visual separado

#### Scenario: Ativar notificações sem fluxo entregue

- **WHEN** uma pessoa ativar o controle de notificações enquanto não houver fluxo de notificações implementado
- **THEN** a aplicação MUST manter a rota e não iniciar chamada HTTP ou operação de domínio não especificada

### Requirement: O topbar evita duplicidade com a agenda

Quando os controles de data e agendamento forem fornecidos pela casca interna, a página de agenda MUST manter seu conteúdo de agenda sem duplicar o mesmo conjunto de controles no cabeçalho local.

#### Scenario: Agenda com topbar compartilhado

- **WHEN** a rota `/appointments` for renderizada com o topbar
- **THEN** deve existir uma única instância funcional dos controles de data e da ação “Agendar”, e o conteúdo da agenda MUST continuar visível abaixo do topbar
