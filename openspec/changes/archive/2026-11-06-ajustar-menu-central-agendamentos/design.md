# Design

## Context

Conforme a proposta, a página `AppointmentsPage` já possui um cabeçalho local com título e subtítulo, seguido da agenda semanal. A casca `AppLayout`/`AppTopbar` já fornece navegação temporal, busca e a ação de criação; esses controles não devem ser duplicados no cabeçalho local.

## Goals / Non-Goals

**Goals:**

- Compor o cabeçalho local com a mesma hierarquia da referência: identidade à esquerda e seletor de visualização à direita.
- Reutilizar ícones, botões, tokens de cor e convenções de foco já presentes no projeto.
- Tornar o estado semanal explícito para pessoas usuárias e tecnologia assistiva.
- Permitir uma evolução futura para Dia e Lista sem atrelar esta mudança a novos dados ou rotas.

**Non-Goals:**

- Criar estado persistido, rota ou query para alternar entre semana, dia e lista.
- Alterar a composição do `AppTopbar`, a consulta da agenda, a criação de agendamentos ou os cartões dos atendimentos.

## Decisions

- **Manter o cabeçalho em `AppointmentsPage`:** o menu pertence ao contexto visual da agenda e não às ações globais da casca. Isso preserva a separação já documentada entre topbar compartilhado e conteúdo da página.
- **Usar um grupo semântico de controles de visualização:** “Semana”, “Dia” e “Lista” devem ser identificáveis por texto e ícone; “Semana” terá estado pressionado/selecionado, e as opções futuras terão semântica de indisponibilidade sem iniciar ação. Uma navegação por rota foi descartada porque os modos ainda não existem e a spec não autoriza novos contratos.
- **Reutilizar primitives e tokens existentes:** a implementação deve usar os componentes visuais e ícones já disponíveis, com a cor de marca existente para o bloco de calendário e o estado ativo. Não será adicionada dependência nem uma folha de estilo paralela.
- **Responsividade por reorganização do cabeçalho:** em viewport estreita, o agrupamento de identidade e o seletor pode empilhar ou quebrar linha, preservando leitura, foco e ausência de rolagem horizontal. O conteúdo da agenda continuará abaixo do cabeçalho.

## Risks / Trade-offs

- **[Risco]** O seletor pode parecer funcional para Dia e Lista apesar de esses modos não existirem. → Mitigar com estado acessível de indisponibilidade, sem navegação e sem requisição, mantendo a indicação clara de Semana ativa.
- **[Risco]** Textos ou controles podem competir por espaço em telas estreitas. → Mitigar com layout responsivo testado no breakpoint já usado pela página e com teste de ausência de overflow horizontal.
- **[Trade-off]** O cabeçalho será fiel à referência visual sem implementar os dois modos futuros. → Preserva o escopo atual e evita simular dados ou regras de negócio inexistentes.

## Migration Plan

1. Atualizar a composição visual do cabeçalho da agenda e seus estados acessíveis.
2. Acrescentar testes direcionados para identidade, seletor, estado ativo, opções futuras e viewport estreita.
3. Executar lint, testes afetados, build e `openspec validate ajustar-menu-central-agendamentos --strict`.
4. Se a mudança precisar ser revertida, remover o bloco visual adicionado e restaurar o cabeçalho atual; nenhum dado, rota ou contrato externo exigirá migração.
