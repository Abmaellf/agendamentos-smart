# Design

## Context

Consulte `proposal.md` para a motivação e `specs/application-shell-baseline/spec.md` para o contrato comportamental. O layout atual já mantém o estado da sidebar em `AppLayout`, renderiza `AppSidebar` em variantes desktop/compacta e tem uma implementação de `AccountMenu` baseada no perfil remoto. A página de agenda mantém, de forma independente, a data selecionada e os controles de semana.

A change ativa `refatorar-menu-lateral` já entrega a definição tipada de navegação e os comportamentos de foco, Escape e bloqueio de rolagem da sidebar. Esta change deve se apoiar nessa composição, sem duplicar a navegação nem remover seus comportamentos acessíveis.

## Goals / Non-Goals

**Goals:**

- Criar uma composição única de topbar para as rotas internas, alinhada à referência visual e responsiva.
- Fazer o mesmo controle hamburger alternar a sidebar persistente em telas amplas e abrir o painel em telas compactas.
- Compartilhar a data selecionada entre o topbar e a agenda, mantendo a navegação temporal sem alterar a URL.
- Reutilizar os primitivos visuais e fluxos já existentes, especialmente `AppSidebar`, `AccountMenu`, `CreateAppointmentDialog`, `Button`, `Input` e os ícones Lucide.
- Manter a busca e as notificações como elementos seguros do shell enquanto não existe contrato de domínio para resultados e notificações.

**Non-Goals:**

- Criar uma nova biblioteca visual, dependência, rota ou endpoint.
- Implementar resultados de busca, centro de notificações, leitura de notificações ou navegação de perfil.
- Reescrever a navegação lateral, suas permissões ou o card informativo já cobertos pela change relacionada.
- Alterar o contrato de datas da API ou os critérios de semana útil da agenda.

## Decisions

### Topbar compartilhado separado da navegação lateral

Adicionar um componente compartilhado de topbar responsável pela apresentação e pelos callbacks das ações globais. `AppLayout` continuará sendo o dono do estado responsivo, passando ao topbar o estado da sidebar e os handlers de alternância; `AppSidebar` continuará responsável somente pela superfície e pelas entradas laterais.

Manter topbar e sidebar como componentes separados evita acoplar busca, data e ações de conta à lista de rotas. Colocar todos os elementos em `AppSidebar` foi rejeitado porque dificultaria o layout desktop da referência e faria o painel compacto carregar responsabilidades que não pertencem à navegação.

### Um controle hamburger para os dois breakpoints

O controle hamburger ficará no topbar e será o único acionador público da sidebar. Em `981px` ou mais, alternará `isSidebarCollapsed`; abaixo desse limiar, abrirá o painel compacto existente. O `Brand` da sidebar deixará de oferecer um segundo controle de recolhimento, evitando dois estados visuais para a mesma ação.

O painel compacto preservará o overlay, `role="dialog"`, Escape, bloqueio temporário do `body` e restauração de foco já implementados. A mudança altera a origem visual do acionador, não o contrato de acessibilidade do painel.

### Estado de data compartilhado no shell

Criar um pequeno contexto local da casca para `selectedDate`, `setSelectedDate`, “Hoje” e deslocamento de sete dias. O provider será montado pelo `AppLayout`; o topbar consumirá os controles e `AppointmentsPage` consumirá a mesma data para calcular a semana e a data padrão do diálogo.

Essa decisão evita que o topbar altere apenas uma data decorativa enquanto a agenda continua em outro período. Um estado duplicado em `AppTopbar` e `AppointmentsPage` foi rejeitado por permitir divergência observável. O contexto não será persistido nem enviado à API.

### Reuso do fluxo de agendamento e do perfil

O botão “Agendar” usará `CreateAppointmentDialog` e a sessão de agenda já fornecida pelo RTK Query. O topbar só exibirá a ação quando a sessão necessária estiver disponível; a consulta reutilizará o cache existente e não criará endpoint.

`AccountMenu` será incorporado ao topbar e manterá a consulta `useGetProfileQuery`, o avatar local já usado e o `DropdownMenu` existente. Ajustes de estilo e nomes acessíveis serão feitos no componente compartilhado, sem criar uma nova tela de perfil.

### Busca e notificações sem dados falsos

O campo de busca será um `Input` controlado localmente, com ícone, placeholder e indicador visual de `⌘ K`. O atalho pode focar o campo, mas a change não filtrará entidades nem fará requisição. O controle de notificações será um botão acessível com `Bell`; o contador só será renderizado quando existir um valor de estado explicitamente fornecido, evitando exibir uma quantidade fictícia como se fosse dado de produção.

Uma implementação com resultados simulados, badge fixo ou novo endpoint foi rejeitada por criar um contrato de domínio sem fonte de dados e por conflitar com as regras de segurança do frontend.

### Responsividade e composição da agenda

O topbar usará layout flexível e classes responsivas alinhadas ao breakpoint existente. Em telas estreitas, a busca e os controles secundários poderão ser compactados visualmente, mas o hamburger, a data, notificações e perfil permanecerão nomeados e utilizáveis. A página de agenda removerá seu cabeçalho duplicado de data/ação e manterá somente a grade, estados de carregamento/erro/vazio e seu conteúdo de domínio.

## Risks / Trade-offs

- [O topbar global pode carregar a sessão de agendamento fora da agenda] → reutilizar o cache RTK Query, não criar endpoint e ocultar a ação quando não houver sessão válida.
- [Uma viewport pequena pode não comportar todas as ações da referência] → aplicar agrupamento responsivo, manter controles essenciais nomeados e validar visualmente em 360px e 1280px.
- [A remoção do cabeçalho da agenda pode alterar espaçamentos existentes] → ajustar o espaçamento no shell/topbar e cobrir a rota com teste de ausência de duplicidade.
- [A change ativa da sidebar pode evoluir em paralelo] → preservar a definição tipada, o foco, Escape, overlay e bloqueio de rolagem; qualquer divergência deve ser registrada e resolvida antes da aplicação.
- [O avatar local pode não representar a identidade real de cada clínica] → manter o asset já usado pelo `AccountMenu`, documentar o consumidor e não tratá-lo como dado de identidade/autorização.

## Migration Plan

1. Adicionar o estado compartilhado de data e o componente de topbar, integrando o botão hamburger ao estado já existente da casca.
2. Reusar o fluxo de perfil e agendamento, retirar o controle duplicado da sidebar e remover os controles duplicados do cabeçalho da agenda.
3. Atualizar testes e READMEs, executar teste focal, lint, build e inspeção visual nos dois tamanhos de referência.
4. Em caso de rollback, restaurar o cabeçalho local da agenda e o acionador anterior da sidebar; não há migração de dados, rota, API ou banco.
