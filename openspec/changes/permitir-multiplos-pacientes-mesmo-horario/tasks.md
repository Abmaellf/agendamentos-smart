# Tasks

## 1. Contrato e criação de vagas simultâneas

- [x] 1.1 Reconciliar esta change com `alinhar-tela-agendamento-resposta-backend`, preservando o contrato de leitura e os fixtures vigentes da agenda; verificar com `openspec validate` nas duas changes e revisão dos deltas de `weekly-appointments`.
- [x] 1.2 Confirmar com a API o código e o corpo de erro para capacidade esgotada, conflito de paciente e conflito de profissional, além da aceitação de pacientes distintos no mesmo intervalo com capacidade disponível; verificar contra ambiente integrado ou contrato documentado pelo backend.
- [x] 1.3 Ajustar a criação para permitir a tentativa de um paciente distinto em intervalo já ocupado e mapear as recusas confirmadas da API para orientação no diálogo, sem contagem local de vagas; verificar com testes do diálogo para sucesso simultâneo e cada recusa confirmada.
- [x] 1.4 Atualizar o README de `src/features/appointments/` com o fluxo de atendimento em grupo e a dependência da validação autoritativa da API; verificar que a documentação distingue o comportamento entregue de qualquer contrato ainda pendente.

## 2. Grade semanal para atendimentos em grupo

- [x] 2.1 Ajustar o posicionamento da grade para distribuir qualquer conjunto de agendamentos simultâneos aceitos pela API em faixas laterais estáveis no mesmo intervalo; verificar com testes unitários para dois, três e cinco cartões sobrepostos, incluindo intervalos adjacentes.
- [x] 2.2 Ajustar a apresentação dos cartões simultâneos para manter paciente, serviço e estado acessíveis e identificáveis em faixa estreita e viewport reduzida, conforme o protótipo; verificar com teste de renderização e revisão visual responsiva.
- [x] 2.3 Atualizar fixtures e o teste de integração da agenda com pacientes distintos no mesmo serviço, dia e horário, confirmando a presença de todos os cartões e de suas informações; verificar em `appointments-page.integration.test.tsx`.

## 3. Verificação integrada

- [x] 3.1 Executar os testes direcionados de formulário, grade semanal e página de agendamentos; registrar evidência dos cenários de capacidade disponível, capacidade esgotada, conflito de paciente e conflito de profissional ou o bloqueio externo real. Evidência: 55 testes aprovados em 12/11/2026.
- [x] 3.2 Executar `npm run lint` e `npm run build`; corrigir regressões introduzidas e registrar separadamente falhas preexistentes ou bloqueios externos. Evidência: lint aprovado em 12/11/2026; build bloqueado somente pelos três erros TypeScript preexistentes de `CardDay` e seu teste legado.
- [x] 3.3 Executar `openspec validate permitir-multiplos-pacientes-mesmo-horario --strict` e confirmar que proposal, delta spec, design e tarefas refletem a implementação e as verificações realizadas. Evidência: validação estrita aprovada em 12/11/2026.

## Workflow follow-up

- Após implementar, revisar e validar todas as tarefas, arquivar a change e conferir a promoção da spec `weekly-appointments`.
