# Tasks

## 1. Inventário das features e evidências

- [x] 1.1 Mapear `appointments`, `patients`, `session`, páginas legadas e `src/components/` com CodeGraph, registrando arquivos, símbolos, callers e testes relacionados; verificar a cobertura do mapa com `codegraph status` e `codegraph explore` direcionados. Evidência: `codegraph status` atualizado e explorações direcionadas aos padrões compartilhados e candidatos, sem alterações preexistentes fora desta change.
- [x] 1.2 Ler os componentes e testes dos candidatos encontrados e consolidar no registro da auditoria a finalidade, entradas, estados, consumidores, documentação e lacunas; verificar que cada afirmação do inventário aponta para arquivo, símbolo, teste ou bloqueio observável. Evidência: seção “Registro da auditoria” em `design.md`, baseada nos componentes, READMEs e testes lidos.

## 2. Classificação e contrato de reutilização

- [x] 2.1 Comparar os dois fluxos de criação de paciente, as duas formas de paginação, o padrão de campo com erro e os componentes legados da agenda; registrar para cada um `extrair`, `manter na feature`, `adiar por contrato`, `legado/órfão` ou `fora do escopo`, com risco e próximo passo; verificar que endpoints, estado e permissões não foram alterados. Evidência: matriz de classificação em `design.md`; nenhuma API, rota, estado persistido ou permissão foi alterada.
- [x] 2.2 Selecionar no máximo um candidato de baixo risco para a primeira extração, ou registrar que nenhum possui contrato compatível e reuso comprovado; verificar a decisão contra os requisitos de `feature-ui-reuse-audit` e atualizar a matriz no design/registro da change. Evidência: `FormField` foi selecionado como único candidato, com contrato limitado à apresentação/acessibilidade e dois consumidores em features distintas.

## 3. Extração incremental do candidato aprovado

- [x] 3.1 Quando houver candidato aprovado, criar o componente customizado em `src/components/`, com entradas tipadas e sem import de lógica de feature; migrar somente os consumidores aprovados e verificar que a regra de domínio permanece na feature. Evidência: `src/components/form-field.tsx` é apresentacional e é consumido por `appointments` e `patients`; schemas, hooks, mutações e contratos HTTP permaneceram nas features.
- [x] 3.2 Adicionar ou ajustar testes do componente compartilhado e dos consumidores migrados, cobrindo comportamento, estados, acessibilidade e compatibilidade visual relevante; verificar a suíte direcionada sem introduzir mudança de rota, API, dados ou permissão. Evidência: `FormField` 2/2, diálogo de agendamento 27/27, cadastro de paciente 1/1, página de pacientes 2/2 e página de agenda 24/24.
- [x] 3.3 Atualizar os READMEs dos módulos cuja responsabilidade de pasta mudou e registrar consumidores migrados, não migrados, candidatos adiados e falhas preexistentes; verificar que a documentação não declara como entregue fluxo ainda não implementado. Evidência: READMEs de `src/components`, `features/appointments` e `features/patients` atualizados; contratos duplicados e componentes legados permanecem explicitamente fora da extração.

## 4. Verificação da change

- [x] 4.1 Executar `npm run lint`, `npm run build` e os testes direcionados das features afetadas, registrando sucesso, falha preexistente ou bloqueio externo com evidência; verificar que qualquer regressão nova seja corrigida antes da conclusão. Evidência: lint direcionado dos arquivos alterados passou; testes afetados passaram (`2 + 27 + 1 + 2 + 24`); `npm run lint` falha apenas pelos imports não usados preexistentes em `app-sidebar.test.tsx`; `npm run build` falha apenas pelos contratos legados de `CardDay`/fixtures e pelos mesmos imports preexistentes.
- [x] 4.2 Executar `openspec validate identificar-componentes-reutilizaveis-entre-features --strict` e revisar o status da change; verificar que proposal, spec, design e tasks estejam presentes e coerentes com o estado real. Evidência: `openspec validate identificar-componentes-reutilizaveis-entre-features --strict` aprovado.

## Workflow follow-up

- Arquivar a change somente após revisão, validação estrita e atualização das specs principais, caso a implementação tenha sido concluída.
