# Tasks

## 1. Controle pesquisável compartilhado

- [x] 1.1 Criar em `src/components/searchable-select.tsx` um controle controlado de catálogo com opções tipadas, placeholder, estado desabilitado/carregando/vazio, lupa dentro da busca e semântica de combobox/listbox; verificar que o controle não importa lógica de `appointments` nem altera contratos HTTP. Evidência: componente apresentacional criado sem imports de feature ou API.
- [x] 1.2 Implementar a filtragem local normalizada por trecho, ignorando caixa e acentuação, mantendo busca transitória separada do valor selecionado e suportando seleção, Escape, clique externo e restauração da seleção; verificar com testes unitários os casos de correspondência, nenhum resultado, limpeza da busca e cancelamento. Evidência: `searchable-select.test.tsx` cobre filtro normalizado, seleção, limpeza, vazio e cancelamento.
- [x] 1.3 Cobrir no teste do controle a navegação por teclado, estados `aria-expanded`/opção ativa, nome acessível do campo, foco de retorno e rolagem da lista; verificar que a suíte direcionada passa com `npm run test -- src/components/__tests__/searchable-select.test.tsx`. Evidência: suíte direcionada aprovada, 1 arquivo e 5 testes.

## 2. Integração no diálogo de novo agendamento

- [x] 2.1 Substituir os selects de paciente, unidade, serviço e profissional por instâncias do controle compartilhado, mantendo os identificadores no `AppointmentFormState`, os placeholders “Selecione”/“Sem profissional” e a dependência de profissional por `serviceId`; verificar que trocar serviço continua preenchendo duração/preço e limpando o profissional anterior. Evidência: diálogo integrado; suíte direcionada com 34 testes aprovada.
- [x] 2.2 Integrar `id`, `aria-describedby`, label, erro e foco do controle com `FormField`, preservando a validação do primeiro campo obrigatório e os estados de carregamento/erro/vazio dos catálogos; verificar os atributos acessíveis e o foco no teste do diálogo. Evidência: teste do controle e testes WB-20 do diálogo aprovados.
- [x] 2.3 Atualizar `src/features/appointments/__tests__/create-appointment-dialog.test.tsx` para interagir com a busca textual por nome/trecho, acentuação, ausência de resultados, seleção, teclado e profissional opcional; verificar que o payload continua usando os mesmos IDs e que não há request por caractere. Evidência: 34 testes do componente/diálogo aprovados; busca de `Ána` por `ana`, teclado no serviço e contagem de requests cobertos.
- [x] 2.4 Atualizar os READMEs de `src/features/appointments/` e `src/components/` para documentar o campo pesquisável, sua fronteira apresentacional e a filtragem local; verificar que a documentação não declara busca remota, novos filtros ou alteração de contrato HTTP. Evidência: READMEs dos dois módulos atualizados.

## 3. Verificação integrada da change

- [x] 3.1 Executar os testes direcionados do controle e do diálogo, `npm run lint` e `npm run build`; registrar no change qualquer falha preexistente ou bloqueio externo e corrigir regressões introduzidas pela busca. Evidência: testes direcionados aprovados (2 arquivos, 34 testes); lint falha apenas nos imports não usados preexistentes de `app-sidebar.test.tsx`; build falha apenas nos contratos legados de `CardDay`/fixtures e nesses mesmos imports.
- [x] 3.2 Confirmar por inspeção dos testes ou mocks que abrir o diálogo ainda carrega os catálogos uma vez, trocar serviço consulta profissionais somente pelo novo serviço e digitar na busca não cria chamadas HTTP adicionais; registrar a evidência nos artefatos da change. Evidência: testes do diálogo verificam contadores de catálogo, query `service-fisio`/`service-pilates` e ausência de requests ao digitar.
- [x] 3.3 Executar `openspec validate adicionar-selects-pesquisaveis-no-agendamento --strict` e revisar que proposal, delta spec, design e tasks permanecem coerentes com o comportamento implementado antes de solicitar o arquivamento. Evidência: validação estrita aprovada; `git diff --check` e ESLint dos arquivos alterados também aprovados.

## Workflow follow-up

- Arquivar a change somente após a implementação, revisão e validação estrita estarem concluídas e as tarefas refletirem evidência real.
