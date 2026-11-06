# Spec Delta

## MODIFIED Requirements

### Requirement: Áreas autenticadas usam a casca visual comum

As rotas de agenda, pacientes, profissional e configuração MUST usar o layout interno compartilhado. Esse layout MUST apresentar a navegação principal em um menu lateral: persistente ao lado do conteúdo em telas amplas e em painel lateral acionável em telas compactas. Login e cadastro MUST continuar usando o layout de autenticação.

#### Scenario: Entrada na agenda

- **WHEN** a rota `/appointments` for renderizada
- **THEN** a página MUST ser composta dentro do layout interno da aplicação

#### Scenario: Área interna em tela ampla

- **WHEN** uma pessoa acessar uma rota interna em uma tela ampla
- **THEN** o conteúdo MUST permanecer visível ao lado do menu lateral persistente, sem a navegação horizontal legada

#### Scenario: Área interna em tela compacta

- **WHEN** uma pessoa acessar uma rota interna em uma tela compacta
- **THEN** o conteúdo MUST permanecer acessível com um controle nomeado para abrir o painel lateral

#### Scenario: Fechamento do painel compacto

- **WHEN** o painel lateral compacto estiver aberto e a pessoa acionar seu controle de fechamento ou a tecla Escape
- **THEN** o painel MUST fechar e devolver o foco ao controle que o abriu

## ADDED Requirements

### Requirement: Menu lateral comunica as áreas disponíveis

O menu lateral MUST apresentar a identidade visual da clínica, ícones e rótulos para Início, Agenda, Pacientes, Profissionais e Configurações. Cada entrada disponível MUST levar à rota já entregue correspondente; Início MUST usar a rota inicial existente. A entrada da rota atual MUST ter estado ativo distinguível visualmente e por tecnologia assistiva.

#### Scenario: Navegação por uma entrada disponível

- **WHEN** uma pessoa ativar Agenda, Pacientes, Profissionais ou Configurações no menu lateral
- **THEN** a aplicação MUST navegar para a rota interna correspondente e indicar a entrada selecionada como ativa

#### Scenario: Navegação para Início

- **WHEN** uma pessoa ativar Início no menu lateral
- **THEN** a aplicação MUST usar a rota inicial existente, sem declarar uma nova rota interna

### Requirement: Destinos não implementados são apresentados sem navegação

O menu lateral MUST apresentar Serviços, Relatórios e Financeiro com a indicação textual “Em breve”. Essas entradas MUST ser indisponíveis, não receber destino navegável e não alterar a rota nem iniciar operação de domínio quando ativadas.

#### Scenario: Tentativa de ativar um destino em breve

- **WHEN** uma pessoa selecionar Serviços, Relatórios ou Financeiro
- **THEN** a aplicação MUST manter a rota atual e comunicar que o destino ainda não está disponível

### Requirement: Menu lateral reproduz os elementos funcionais da referência visual

O menu lateral MUST incluir cabeçalho de marca, controle de abertura ou fechamento conforme o espaço disponível, agrupamento vertical de navegação e card informativo de rodapé. O card informativo MUST ser apenas apresentacional nesta mudança e não iniciar navegação externa ou ação de domínio.

#### Scenario: Exibição do card informativo

- **WHEN** o menu lateral estiver visível
- **THEN** o card informativo MUST ser exibido como conteúdo não interativo no rodapé do menu
