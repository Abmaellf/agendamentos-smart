# Tasks

## 1. Cabeçalho e menu visual da agenda

- [x] 1.1 Atualizar o cabeçalho de `AppointmentsPage` para reproduzir a referência fornecida, com bloco verde arredondado e ícone de calendário, título/subtítulo à esquerda e seletor segmentado “Semana”, “Dia” e “Lista” à direita; verificar visualmente a hierarquia, o estado ativo de “Semana” e a preservação da agenda semanal existente. Evidência: implementação em `src/features/appointments/pages/appointments-page.tsx` e teste direcionado aprovado.
- [x] 1.2 Implementar a semântica acessível e o comportamento das opções futuras, mantendo “Semana” selecionada e Dia/Lista sem navegação, requisição ou alteração dos dados; adicionar/ajustar testes em `src/features/appointments/__tests__/appointments-page.integration.test.tsx` e verificar os cenários da delta spec. Evidência: testes de estado acessível e ausência de nova consulta incluídos; arquivo direcionado passou com 17 testes.
- [x] 1.3 Ajustar a organização responsiva do cabeçalho para viewport estreita, sem rolagem horizontal ou sobreposição; verificar em teste ou inspeção visual que título, subtítulo, ícone e seletor continuam identificáveis e utilizáveis. Evidência: classes responsivas e teste de reorganização adicionados; arquivo direcionado passou.

## 2. Verificação da change

- [x] 2.1 Executar os testes direcionados da agenda e confirmar que os estados de carregamento, erro, vazio, dados, navegação temporal e criação continuam passando junto aos novos testes do cabeçalho. Evidência: `npm run test -- src/features/appointments/__tests__/appointments-page.integration.test.tsx --reporter=dot` passou com 17/17 testes.
- [x] 2.2 Executar `npm run lint` e `npm run build`, registrando no estado da change qualquer falha preexistente ou bloqueio externo; validar os artefatos com `openspec validate ajustar-menu-central-agendamentos --strict`. Evidência: lint passou; validação OpenSpec passou; build bloqueado pelos três erros TypeScript preexistentes de `src/components/Card/CardDay/index.tsx` e `src/components/__tests__/legacy-calendar-components.test.tsx`, já documentados no guia SDD.

## Workflow follow-up

- Após a implementação, revisão e validação, arquivar com `openspec archive ajustar-menu-central-agendamentos --yes`.
