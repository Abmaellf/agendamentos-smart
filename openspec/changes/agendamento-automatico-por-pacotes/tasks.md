# Tasks

## 1. Pré-requisitos e contratos de disponibilidade

- [ ] 1.1 Concluir e validar a change SPEC 01 `gerenciar-pacotes-flexiveis` nos repositórios frontend e API, incluindo o contrato de pacote ativo, escopo de unidade e ponto de consulta de uso; verificar com as validações OpenSpec estritas e testes reais da SPEC 01.
- [x] 1.2 No repositório da API irmã, criar ou atualizar a change OpenSpec coordenada para esta capability antes de modificar migration, contrato ou código; verificar que sua proposal, delta spec, design e tarefas refletem esta change e passam em `openspec validate --strict`.
- [ ] 1.3 Documentar que o fluxo reutiliza o horário explícito do agendamento manual e que a geração considera somente data mínima e dias efetivos; registrar calendário operacional, feriados e bloqueios como escopo de uma SPEC futura e verificar que nenhum horário arbitrário é criado.
- [ ] 1.4 Definir os códigos de erro e os campos mínimos dos contratos de elegibilidade, prévia, confirmação e contratação, incluindo configuração ausente, prévia obsoleta, conflito e idempotência; verificar revisão de contrato com frontend e API sem alteração do POST manual existente.

## 2. Modelo e regras de domínio na API

- [x] 2.1 Criar migration e entidades da contratação de pacote, snapshot, dias efetivos únicos e vínculo opcional de cada appointment à contratação, com FKs, índices de escopo, auditoria e unicidade de idempotência; verificar migration em PostgreSQL descartável e que appointments legados permanecem com vínculo nulo.
- [ ] 2.2 Implementar a consulta de pacotes elegíveis para contratação, derivando clínica/unidade do principal e retornando somente pacotes ativos e campos mínimos; verificar integrações com ADMIN, BASIC, duas clínicas, unidade não autorizada e pacote inativo.
- [x] 2.3 Implementar o cálculo puro de datas no fuso da unidade a partir da data mínima, total de sessões e dias efetivos, sem consultar calendário/feriados nesta change; verificar testes unitários para uma a sete frequências, data inicial fora do dia, fins de semana permitidos, total exato e última semana incompleta.
- [ ] 2.4 Reutilizar o horário informado no fluxo manual e a validação existente de profissional opcional, duração, preço, conflitos e capacidade; verificar que nenhum horário ou dia alternativo é inventado e que a ausência de fonte de calendário não bloqueia a confirmação nesta change.
- [ ] 2.5 Extrair de `AppointmentService` uma fronteira interna reutilizável para escopo, duração/preço, profissional, conflito de paciente/profissional e capacidade, preservando o comportamento do agendamento manual; verificar a suíte existente de criação manual e novos testes diretos para os mesmos conflitos em comando único e em lote.
- [x] 2.6 Implementar a prévia não persistente que combina datas, horário manual e validação compartilhada, devolve todas as sessões, conflitos e fingerprint; verificar integração de prévia válida, conflito, pacote/paciente externo, calendário não consultado, prévia sem reserva e dias efetivos alterados sem mutar o pacote.
- [x] 2.7 Implementar a confirmação que revalida fingerprint, horário manual e disponibilidade sob o bloqueio de clínica, cria contratação/snapshot/appointments em uma transação e atualiza a consulta de uso da SPEC 01; verificar rollback ao falhar uma sessão, recusa de prévia obsoleta, imutabilidade posterior do pacote e preservação do snapshot.
- [ ] 2.8 Implementar idempotência de contratação no escopo da clínica sem reutilizar a mesma chave de appointment em várias sessões; verificar chamadas repetidas e concorrentes retornam uma única contratação e a quantidade exata de appointments.
- [ ] 2.9 Expor os endpoints de prévia, confirmação e consulta de contratação com autorização e envelopes compatíveis com a API; verificar MockMvc/integração para payloads, códigos, isolamento de clínica/unidade e leitura dos agendamentos convencionais sem contrato.
- [ ] 2.10 Atualizar os READMEs de appointments, service packages, migrations e novos módulos da API com os contratos, dependências de calendário/horário e limites de reposição; verificar que os exemplos não sugerem reserva na prévia.

## 3. Fluxo de contratação no frontend

- [x] 3.1 Criar a feature frontend de contratação de pacotes com tipos canônicos, adaptador RTK Query, tags de cache e parser dos envelopes reais de elegibilidade, prévia, confirmação e contratação; verificar testes de contrato MSW para decimal, snapshot, sessões, conflitos e fingerprint.
- [x] 3.2 Implementar a entrada de `Agendamento de Pacotes` disparada pelo topbar e substituir a mensagem temporária, mantendo `Agendar` e o diálogo manual inalterados; verificar teste de topbar que confirma abertura do fluxo, nomes acessíveis e ausência de regressão do botão manual.
- [ ] 3.3 Implementar seleção acessível de unidade quando permitida, serviço, pacote e paciente usando os catálogos existentes; verificar estados de carregamento, vazio, erro recuperável, pacote inativo e restrição visual de unidade BASIC sem confiar nela como autorização.
- [x] 3.4 Implementar a etapa de data mínima e editor de dias efetivos, pré-preenchidos pelos dias do pacote, com um a sete dias distintos e frequência somente leitura; verificar testes Zod/UI para manter sugestão, alterar dias, impedir conjunto vazio/duplicado e garantir que a tela não envia alteração administrativa do pacote.
- [x] 3.5 Implementar a tela de prévia com pacote, paciente, unidade, valor, data solicitada, primeira/última data, todas as sessões, horário manual e conflitos, sem tratá-la como reserva; verificar MSW/UI para data inicial deslocada, calendário não consultado e conflito bloqueando confirmação.
- [x] 3.6 Implementar confirmação com `Idempotency-Key`, fingerprint e estados de envio/erro, preservando os dados para nova prévia quando houver conflito ou obsolescência; verificar que duplo clique/repetição não dispara criação duplicada e que sucesso navega/exibe a contratação retornada.
- [ ] 3.7 Implementar consulta autorizada da contratação e suas sessões vinculadas, distinguindo condições contratadas de estados das sessões sem oferecer reposição ou decisão financeira; verificar testes de tela para sessão cancelada/falta sem alteração automática de quantidade.
- [ ] 3.8 Atualizar o README da feature appointments e criar/atualizar o README da feature de contratação para documentar a separação pacote configurado → contratação → appointment, os dias efetivos editáveis e as dependências de calendário/horário; verificar rotas, endpoints e limites documentados.

## 4. Verificação integrada e entrega

- [ ] 4.1 Executar os testes unitários e de integração da API para cálculo por dias efetivos, disponibilidade, transação, idempotência, snapshot, permissões e não regressão do agendamento manual; registrar comandos e resultados reais, incluindo cenários concorrentes.
- [ ] 4.2 Executar os testes Vitest/MSW afetados, `npm run lint` e `npm run build`; corrigir falhas introduzidas e registrar separadamente falhas preexistentes comprovadas.
- [ ] 4.3 Executar `./mvnw clean verify` no repositório da API, validar o fluxo ponta a ponta com banco descartável e registrar a evidência de que prévia não reserva e confirmação cria exatamente todas as sessões ou nenhuma.
- [ ] 4.4 Executar `openspec validate agendamento-automatico-por-pacotes --strict` no frontend e a validação estrita da change coordenada na API; confirmar que tarefas, contratos, documentação e dependências representam o estado real.

## Workflow follow-up

- Não iniciar a implementação sem a SPEC 01 e a change coordenada da API validadas. A fonte de calendário/feriados/bloqueios será tratada em uma SPEC futura; o horário desta change vem do formulário manual.
- Arquivar as changes coordenadas somente após todas as tarefas, verificações e revisões documentais estarem concluídas.
