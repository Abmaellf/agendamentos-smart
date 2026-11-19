# Tasks

## 1. Contrato de status e base de testes

- [x] 1.1 Alinhar com a API irmã o contrato de transição `PATCH /api/appointments/{id}/status`, os estados aceitos (`ATENDENDO` e `CANCELADO` para este incremento), a resposta `Appointment` atualizada e o retorno autoritativo de `FALTA` após dez minutos; verificar com documentação/teste HTTP do backend e bloquear a aplicação frontend se o contrato não estiver disponível.
- [x] 1.2 Adicionar ao adaptador de appointments a mutação tipada de status e seus tags de invalidação, sem alterar o payload de criação; verificar com teste de contrato que o ID e o status são enviados e que a lista é invalidada após sucesso.
- [x] 1.3 Estender o servidor de testes e fixtures com respostas de sucesso, erro e status `FALTA` autoritativo; verificar com handlers MSW que cada cenário não depende de estado local do modal.

## 2. Modal de detalhes e seleção na agenda

- [x] 2.1 Criar a apresentação acessível do modal de detalhes usando os dados atuais de `Appointment` — paciente, ID, serviço, data, horário, duração, profissional e status — e placeholders desabilitados `Em breve` para telefone, e-mail, nascimento, sala, observações, cadastro completo, edição e conclusão; verificar com teste de componente os dados e campos indisponíveis.
- [x] 2.2 Tornar cada cartão da grade semanal selecionável sem perder nome completo, serviço, horário, status, `data-testid` ou metadados de layout; integrar a seleção ao modal e permitir fechamento por controle e `Escape`; verificar com teste de integração abertura do agendamento correto e fechamento sem alteração.
- [x] 2.3 Preservar a responsividade, foco e leitura assistiva do modal sobre a matriz semanal; verificar com teste de acessibilidade/RTL os nomes dos controles, o estado do diálogo e a ausência de operação ao interagir com recursos futuros.

## 3. Transições e regra de habilitação

- [x] 3.1 Implementar o mapeamento visual `AGENDADO` → `Aguardando atendimento`, `ATENDENDO` → `Atendimento iniciado`, `CANCELADO` → `Cancelado`, `FALTA` → `Falta` e `FINALIZADO` → `Atendida`, mantendo a ação de início sem reversão; verificar com testes para cada estado e para o estado inicial padrão.
- [x] 3.2 Implementar `Iniciar agendamento` para solicitar `ATENDENDO` e `Cancelar agendamento` somente para `AGENDADO`, com carregamento, resposta confirmada e invalidação da agenda; verificar os cenários de sucesso, habilitação e bloqueio de cancelamento após início.
- [x] 3.3 Tratar rejeição da API e falha de rede sem atualização otimista, mantendo o modal aberto, o status confirmado e a ação aplicável reabilitada; verificar com testes de erro e contagem de chamadas HTTP.
- [x] 3.4 Consumir `FALTA` retornado pela API após o limite de dez minutos, bloquear início/cancelamento nesse estado e cobrir a ausência de conversão quando `ATENDENDO` foi confirmado antes do limite; verificar com relógio/fuso controlados e reabertura da agenda.

## 4. Documentação e verificação da change

- [x] 4.1 Atualizar `src/features/appointments/README.md` com o fluxo do modal, o mapeamento dos estados, a dependência do contrato de status e a regra autoritativa de `FALTA`; verificar que a documentação não descreve como entregue nenhum recurso marcado `Em breve`.
- [x] 4.2 Executar os testes direcionados da feature de appointments e registrar a evidência de abertura, transições, erros, limite de dez minutos e não regressão da criação manual.
- [x] 4.3 Executar `npm run lint` e `npm run build`, registrando separadamente falhas preexistentes do calendário legado ou do contrato externo; verificar também `openspec validate adicionar-detalhes-do-agendamento-paciente --strict`.

## Workflow follow-up

- Atualizar os checkboxes somente com evidência real da implementação e dos comandos executados.
- Arquivar a change apenas depois de todas as tarefas concluídas, do contrato da API confirmado e da validação estrita aprovada.
