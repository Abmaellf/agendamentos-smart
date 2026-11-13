# Spec Delta

## MODIFIED Requirements

### Requirement: Menu lateral comunica as áreas disponíveis
O menu lateral MUST apresentar a identidade visual da clínica, ícones e rótulos para Início, Agenda, Pacientes, Profissionais, Serviços e Configurações. Cada entrada disponível MUST levar à rota já entregue correspondente; Início MUST usar a rota inicial existente. Serviços MUST expor Pacotes como submenu navegável para a gestão de pacotes. A entrada da rota atual MUST ter estado ativo distinguível visualmente e por tecnologia assistiva.

#### Scenario: Navegação por uma entrada disponível
- **WHEN** uma pessoa ativar Agenda, Pacientes, Profissionais ou Configurações no menu lateral
- **THEN** a aplicação MUST navegar para a rota interna correspondente e indicar a entrada selecionada como ativa

#### Scenario: Navegação para Pacotes pelo submenu Serviços
- **WHEN** uma pessoa ativar Pacotes no submenu Serviços
- **THEN** a aplicação MUST navegar para a área de gestão de pacotes e indicar Serviços/Pacotes como contexto de navegação ativo

#### Scenario: Navegação para Início
- **WHEN** uma pessoa ativar Início no menu lateral
- **THEN** a aplicação MUST usar a rota inicial existente, sem declarar uma nova rota interna

### Requirement: Destinos não implementados são apresentados sem navegação
O menu lateral MUST apresentar Relatórios e Financeiro com a indicação textual “Em breve”. Essas entradas MUST ser indisponíveis, não receber destino navegável e não alterar a rota nem iniciar operação de domínio quando ativadas.

#### Scenario: Tentativa de ativar um destino em breve
- **WHEN** uma pessoa selecionar Relatórios ou Financeiro
- **THEN** a aplicação MUST manter a rota atual e comunicar que o destino ainda não está disponível

### Requirement: O topbar apresenta as ações globais da referência
O topbar das rotas internas MUST apresentar busca, navegação de data, as ações “Agendar” e “Agendamento de Pacotes” quando a sessão estiver disponível, notificações e acesso ao perfil, com nomes acessíveis e sem sobrepor o conteúdo em telas amplas ou compactas. Enquanto a SPEC 02 não estiver entregue, “Agendamento de Pacotes” MUST comunicar indisponibilidade e não iniciar operação de domínio.

#### Scenario: Exibição das ações do topbar
- **WHEN** uma rota interna for renderizada com sessão disponível
- **THEN** o topbar MUST exibir um campo de busca, o controle “Hoje”, a data corrente, controles de período anterior e próximo, “Agendar”, “Agendamento de Pacotes”, o controle de notificações e o controle de perfil

#### Scenario: Ação de pacotes ainda indisponível
- **WHEN** uma pessoa tentar ativar “Agendamento de Pacotes” antes da entrega da SPEC 02
- **THEN** a aplicação MUST comunicar que a funcionalidade aguarda a SPEC 02 e não criar, consultar ou alterar agendamentos

#### Scenario: Ações do topbar em viewport estreita
- **WHEN** o topbar for renderizado em uma viewport estreita
- **THEN** seus controles MUST permanecer utilizáveis, com agrupamento ou ocultação responsiva que não crie rolagem horizontal nem cubra o conteúdo principal

### Requirement: O topbar evita duplicidade com a agenda
Quando os controles de data e as ações de agendamento forem fornecidos pela casca interna, a página de agenda MUST manter seu conteúdo sem duplicar o mesmo conjunto de controles no cabeçalho local.

#### Scenario: Agenda com topbar compartilhado
- **WHEN** a rota `/appointments` for renderizada com o topbar
- **THEN** deve existir uma única instância funcional dos controles de data, da ação “Agendar” e da ação “Agendamento de Pacotes”, e o conteúdo da agenda MUST continuar visível abaixo do topbar
