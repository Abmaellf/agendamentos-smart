# Proposal

## Why

A casca interna já possui uma sidebar responsiva, mas o controle de recolhimento ainda é apresentado como um controle específico da barra lateral e não existe um cabeçalho compartilhado para as ações mostradas na referência visual. Isso deixa a busca, a navegação temporal da agenda, o acesso rápido a novo agendamento, as notificações e o perfil dispersos ou indisponíveis entre as telas internas.

## What Changes

- Adicionar um topbar compartilhado às rotas internas, mantendo a sidebar existente como navegação principal.
- Substituir o controle visual de recolhimento/abertura por um botão de menu (hamburger) no topbar; em telas amplas ele recolhe ou expande a sidebar persistente e em telas compactas abre o painel lateral.
- Exibir no topbar um campo de busca com o texto de referência, indicação de atalho `⌘ K`, controle “Hoje”, navegação para período anterior/próximo e a data corrente formatada em pt-BR.
- Reutilizar o fluxo existente de criação de agendamento no botão “Agendar” quando a sessão de agenda estiver disponível.
- Reutilizar `AccountMenu`, `DropdownMenu`, `Button`, `Input`, ícones Lucide e a consulta de perfil para o acesso visual ao avatar e ao perfil.
- Adicionar o controle visual de notificações com nome acessível e indicador de não lidas, sem criar endpoint, persistência ou fluxo de notificações nesta change.
- Ajustar o conteúdo da agenda para não duplicar no cabeçalho local os controles que passarem a ser responsabilidade do topbar.
- Atualizar a documentação do layout/componentes e cobrir o comportamento em testes de componente e de responsividade sem alterar rotas, contratos HTTP, permissões ou dependências.

Fora de escopo: implementar busca global ou resultados de busca; criar o domínio de notificações; alterar o contrato da API; criar rotas de perfil; alterar regras de autorização; ou transformar o indicador de notificações em dado de produção sem fonte remota definida.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `application-shell-baseline`: a casca das rotas internas passa a oferecer um topbar compartilhado, controle hamburger para a sidebar e ações globais visíveis de forma responsiva.

## Impact

- Código afetado: `src/_layout/app.tsx`, novos componentes compartilhados do topbar, `src/components/AppSidebar/index.tsx`, `src/components/account-menu.tsx` e `src/features/appointments/pages/appointments-page.tsx`.
- Testes afetados: cobertura da casca interna, sidebar e integração da agenda, incluindo o estado compartilhado da data quando aplicável.
- Documentação afetada: `src/_layout/README.md`, `src/components/README.md` e possivelmente o README da feature de agenda.
- Não há alteração prevista em endpoints, payloads, dados persistidos, rotas, permissões ou dependências externas.
