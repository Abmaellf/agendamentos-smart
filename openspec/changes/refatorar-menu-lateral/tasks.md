# Tasks

## 1. Composição lateral e destinos disponíveis

- [x] 1.1 Criar uma única definição tipada para as entradas do menu e o componente lateral compartilhado, com identidade da clínica, ícones, estado ativo, card informativo e os destinos Início, Agenda, Pacientes, Profissionais e Configurações; verificar por teste de componente os rótulos, os destinos e `aria-current` da rota ativa.
- [ ] 1.2 Reorganizar `AppLayout` para compor a barra lateral e o `Outlet` lado a lado em telas a partir de 981px, eliminando a navegação horizontal e o menu móvel legados depois de migrada sua responsabilidade; verificar manualmente em 1280px que o conteúdo das rotas internas continua legível ao lado do menu.
- [ ] 1.3 Aplicar ao menu a hierarquia visual do anexo (superfície verde escura, seleção verde, marca, ícones e card de rodapé) e documentar em `src/README.md` a nova responsabilidade da casca interna e quaisquer assets de marca efetivamente usados; verificar a renderização em 360px e 1280px sem sobreposição do conteúdo.

## 2. Acessibilidade e áreas ainda indisponíveis

- [x] 2.1 Implementar o painel lateral compacto com acionador e fechamento nomeados, bloqueio temporário de rolagem, Escape e restauração de foco ao acionador; verificar esses fluxos em teste com Testing Library e `user-event`.
- [x] 2.2 Representar Serviços, Relatórios e Financeiro como controles com “Em breve”, `aria-disabled` e sem rota, comunicando a indisponibilidade sem alterar a localização; verificar em teste que a interação preserva a rota e expõe o status indisponível.
- [x] 2.3 Garantir que a navegação compacta seja fechada após uma rota disponível ser selecionada e que o card informativo não seja link ou ação de domínio; verificar esses comportamentos no teste de interação do menu.

## 3. Verificação integrada

- [x] 3.1 Executar o teste focal do menu lateral com `npm run test -- src/components/__tests__/app-sidebar.test.tsx` e registrar o resultado real na execução da change.
- [x] 3.2 Executar `npm run lint` e `npm run build`; corrigir regressões da mudança e registrar separadamente qualquer falha preexistente não relacionada ao menu.
- [ ] 3.3 Executar `openspec validate refatorar-menu-lateral --strict` após as tarefas concluídas e confirmar que os requisitos, tarefas e documentação refletem o estado entregue.

## Evidências de execução

- `codegraph impact AppLayout/Header/MenuMobile`: confirmou que a casca é a
  única chamadora direta dos componentes legados e que o impacto sobe para
  `Router`, `App` e `main`.
- `npm run test -- src/components/__tests__/app-sidebar.test.tsx`: passou com
  1 arquivo e 5 testes, cobrindo destinos/rota ativa, painel compacto,
  indisponíveis e fechamento após navegação.
- `npm run lint`: passou sem diagnósticos.
- `npm run build`: falhou somente em três incompatibilidades de tipagem já
  existentes no calendário legado: `CardDay/index.tsx:52` e
  `legacy-calendar-components.test.tsx:28,50`. Nenhuma delas referencia o
  menu lateral ou os arquivos alterados por esta change.
- As verificações visuais exigidas em 1.2 e 1.3 permanecem pendentes: o
  ambiente não disponibiliza navegador controlável para validar 360px e
  1280px. A tentativa de iniciar a inspeção pelo navegador integrado retornou
  `Browser is not available: iab` e `cua.getState()` não listou navegadores.
