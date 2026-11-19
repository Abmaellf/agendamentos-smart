# Tasks

## 1. Contrato e isolamento do catálogo de pacientes

- [x] 1.1 Atualizar a API do catálogo de agendamento para aceitar a unidade selecionada em `GET /api/patients` e retornar somente pacientes vinculados à unidade quando o solicitante for `ADMIN`; verificar com teste de integração duas unidades da mesma clínica e uma unidade de outra clínica. Evidência: `BasicUnitScopeIntegrationTest` validou catálogo ADMIN sem unidade, filtrado para filial e rejeição de unidade persistida em outra clínica.
- [x] 1.2 Manter a regra server-side de `BASIC`, rejeitando ou ignorando uma unidade diferente da unidade autorizada e retornando somente os pacientes de `activeUnitId`; verificar com testes de escopo e tentativa de ampliação por parâmetro. Evidência: `BasicUnitScopeIntegrationTest` validou catálogo BASIC restrito à unidade ativa e resposta `404` ao solicitar outra unidade.
- [x] 1.3 Atualizar a documentação do contrato da API e confirmar que a resposta de catálogo permanece compatível com as opções de paciente usadas pela agenda; verificar os exemplos e o teste de contrato. Evidência: documentação de controller/service atualizada e teste de integração concluído sem alteração do formato `content`/`id`/`name`.

## 2. Consulta dependente e formulário da agenda

- [x] 2.1 Trocar a consulta de pacientes do diálogo para o catálogo de agendamento com `unitId` como argumento, suspendendo a consulta enquanto não houver unidade válida e separando o cache por unidade; verificar nos testes que nenhuma chamada ocorre antes da unidade e que a requisição contém a unidade escolhida. Evidência: teste do diálogo ADMIN confirmou zero chamadas antes da unidade e `unitId` na chamada posterior; endpoint usa tag/cache por unidade.
- [x] 2.2 Reordenar visualmente Unidade antes de Paciente para `ADMIN`, desabilitar Paciente até a unidade estar selecionada e limpar `patientId` quando a unidade mudar; verificar acessibilidade, estado do botão e ausência de opções da unidade anterior. Evidência: testes do diálogo cobriram ordem Unidade → Paciente, disabled inicial, limpeza e catálogo exclusivo após troca.
- [x] 2.3 Preservar a inicialização de `BASIC` por `activeUnitId`, a unidade não editável e os payloads existentes de criação; verificar regressão do fluxo BASIC e envio de `patientId`/`unitId` consistentes. Evidência: testes direcionados de criação/agendamento passaram e o fluxo BASIC mantém unidade derivada da sessão e payload existente.
- [x] 2.4 Tratar carregamento, erro, vazio e resposta obsoleta do catálogo dependente sem permitir envio; verificar mensagens, nova tentativa e que uma resposta tardia não repopula pacientes da unidade anterior. Evidência: testes do diálogo cobriram loading, catálogo vazio, erro/retry, bloqueio de envio e troca de unidade sem repopular opções anteriores.
- [x] 2.5 Atualizar o README da feature de agenda para documentar a dependência Unidade → Paciente, a chave por unidade e o limite de autoridade do frontend; verificar que o texto não promete autorização no navegador. Evidência: `src/features/appointments/README.md` documenta dependência, cache por unidade e autoridade do backend.

## 3. Fixtures e cobertura do fluxo de cadastro/agendamento

- [x] 3.1 Atualizar builders e handlers MSW para representar pacientes em unidades diferentes, capturar `unitId` nas consultas e invalidar/refazer o catálogo após `POST /patient/save`; verificar que a massa de teste distingue vínculo de clínica e vínculo de unidade. Evidência: MSW filtra pacientes por `unitId`, registra parâmetros por consulta e a mutation existente invalida `PatientCatalog/LIST`, incluindo as tags por unidade.
- [x] 3.2 Cobrir o cenário ADMIN que seleciona uma unidade, encontra o paciente recém-cadastrado nela e não encontra paciente vinculado somente a outra unidade; verificar também a troca de unidade e a limpeza do paciente. Evidência: teste ADMIN adicionou paciente vinculado à segunda unidade, confirmou sua disponibilidade somente após selecioná-la e limpou a seleção anterior.
- [x] 3.3 Cobrir catálogo vazio, falha de consulta, retry, unidade não autorizada e rejeição server-side de combinação paciente/unidade; verificar que o diálogo permanece aberto e não cria agendamento inválido. Evidência: testes do diálogo cobriram vazio/erro/retry e bloqueio; `BasicUnitScopeIntegrationTest` cobriu rejeição server-side BASIC e unidade de outra clínica.

## 4. Verificação integrada

- [x] 4.1 Executar os testes direcionados da agenda e de pacientes, registrar o resultado e separar falhas preexistentes de regressões desta change. Evidência: testes direcionados da agenda passaram (2 arquivos, 59 testes); os testes de pacientes mantêm duas falhas preexistentes, uma por mensagem de duplicidade divergente e outra por seletor ambíguo de `Pilates`, sem alteração nos arquivos envolvidos.
- [x] 4.2 Executar `npm run lint` e `npm run build`, registrando qualquer falha preexistente com a saída do comando. Evidência: `npm run lint` e `npm run build` concluídos com sucesso; o build emitiu apenas o warning existente de chunk acima de 500 kB.
- [x] 4.3 Executar `openspec validate fix-select-list-patient-agenda --strict` e confirmar que os requisitos, tarefas e documentação refletem o estado real da implementação. Evidência: validação concluída com `Change 'fix-select-list-patient-agenda' is valid`.

## Workflow follow-up

- Implementar a API compatível antes de ativar o frontend que depende do filtro por unidade.
- Arquivar somente depois de concluir as tarefas com evidência, validar a change e sincronizar a spec principal.
