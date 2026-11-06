# Tasks

## 1. Casca compartilhada e controle hamburger

- [x] 1.1 Criar o estado compartilhado de data da casca, com data inicial compatível com a agenda e operações de “Hoje”, período anterior e próximo; verificar a transição de datas em teste de componente sem alterar a URL.
- [x] 1.2 Criar o topbar compartilhado com hamburger, estrutura responsiva e nomes acessíveis; verificar em teste a presença das regiões e que o controle alterna `aria-expanded`/`aria-controls` conforme o breakpoint simulado.
- [x] 1.3 Integrar o topbar ao `AppLayout`, fazer o hamburger recolher/expandir a sidebar desktop e abrir o painel compacto, removendo o segundo acionador de recolhimento da marca; executar `npm run test -- src/components/__tests__/app-sidebar.test.tsx` e manter aprovados Escape, foco, overlay e bloqueio de rolagem.

## 2. Ações do topbar e reutilização de componentes

- [x] 2.1 Reutilizar `AccountMenu`, `DropdownMenu`, o avatar existente e a consulta de perfil no topbar, ajustando apenas estilo e acessibilidade; verificar o menu de conta com o teste de consumidor RTK Query e um teste do topbar.
- [x] 2.2 Reutilizar `CreateAppointmentDialog` e a sessão de agenda no botão “Agendar”, sem duplicar endpoint ou regra de criação; verificar que o botão abre o fluxo quando há sessão e não oferece uma ação inválida quando ela não está disponível.
- [x] 2.3 Implementar o campo de busca com placeholder e atalho visual `⌘ K`, além do controle de notificações acessível sem dado fictício ou chamada HTTP; verificar que digitar conserva o valor, o atalho foca o campo e clicar em notificações mantém a rota.
- [x] 2.4 Atualizar `src/components/README.md` e `src/assets/README.md` para registrar o topbar, os componentes reutilizados e o consumidor do avatar; verificar que a documentação não descreve busca ou notificações como fluxos entregues.

## 3. Integração com a agenda e documentação de layout

- [x] 3.1 Fazer `AppointmentsPage` consumir a data compartilhada, remover os controles duplicados de data/agendamento do cabeçalho local e preservar a grade, estados de carregamento/erro/vazio e data padrão do diálogo; verificar por teste que existe uma única instância funcional e que a semana acompanha o topbar.
- [x] 3.2 Ajustar o espaçamento do conteúdo para o topbar em telas amplas e compactas e atualizar `src/_layout/README.md` e `src/features/appointments/README.md`; verificar visualmente a composição em 360px e 1280px sem sobreposição ou rolagem horizontal.

## 4. Verificação integrada

- [x] 4.1 Executar `npm run lint`, os testes focais da casca/topbar/agenda e `npm run build`; corrigir regressões introduzidas pela change e registrar separadamente falhas preexistentes do calendário legado.
- [x] 4.2 Executar `git diff --name-only | codegraph affected --stdin` e revisar os callers/testes afetados; verificar que não houve alteração em rotas, endpoints, dependências, permissões ou contratos HTTP.
- [x] 4.3 Executar `openspec validate adicionar-topbar-menu-hamburguer --strict` e confirmar que os artefatos, tarefas, documentação e evidências refletem o estado real da implementação.

## Evidence

- `npm run test -- src/components/__tests__/app-topbar.test.tsx`: passou com 6 testes.
- `npm run test -- src/components/__tests__/app-sidebar.test.tsx`: passou com 6 testes.
- `npm run test -- src/components/__tests__/rtk-query-consumers.test.tsx src/components/__tests__/app-topbar.test.tsx`: passou com 6 testes; o teste legado de paciente mantém apenas o warning preexistente de botão aninhado.
- `npm run test -- src/components/__tests__/app-topbar.test.tsx src/components/__tests__/app-sidebar.test.tsx src/components/__tests__/rtk-query-consumers.test.tsx src/features/appointments/__tests__/appointments-page.integration.test.tsx --reporter=dot`: passou com 4 arquivos e 28 testes.
- `npm run lint`: aprovado.
- `npm run build`: falhou somente nos erros TypeScript preexistentes de `src/components/Card/CardDay/index.tsx:52` e `src/components/__tests__/legacy-calendar-components.test.tsx:28,50`; nenhum arquivo da change participa desses diagnósticos.
- Inspeção visual com Chrome headless em 1280px e 360px: topbar, hamburger, busca, data, notificações, perfil e conteúdo não apresentaram sobreposição ou rolagem horizontal; a agenda exibiu erro de API porque o backend local não estava iniciado.
- `codegraph sync` e `git diff --name-only | codegraph affected --stdin`: índice atualizado; foram identificados os testes da sidebar, topbar, consumidores RTK Query, agenda e callers afetados. Não houve alteração em `Router.tsx`, `package.json`, endpoints ou contratos HTTP.

## Workflow follow-up

- Arquivar a change somente após todas as tarefas, verificações e a change relacionada `refatorar-menu-lateral` estarem revisadas e concluídas.
