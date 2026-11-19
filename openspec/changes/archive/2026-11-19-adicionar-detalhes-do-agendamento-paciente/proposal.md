# Proposal

## Why

A agenda semanal já apresenta o cartão resumido do paciente, mas não oferece uma forma de consultar os detalhes do atendimento nem de executar as primeiras transições do ciclo de vida. O modal da referência visual concentra esse contexto em um único lugar e reduz o risco de iniciar, cancelar ou marcar falta sem confirmar qual paciente e horário estão sendo tratados.

## What Changes

- Adicionar um modal de detalhes do agendamento aberto a partir do cartão da agenda, com a composição visual da referência: paciente, atendimento, data, horário, serviço, status e ações.
- Apresentar os dados já disponíveis no contrato de `Appointment` em modo de consulta, sem inventar telefone, e-mail, data de nascimento, sala ou observações que ainda não sejam fornecidos pela API.
- Manter `AGENDADO` como o estado visual inicial `Aguardando atendimento`.
- Disponibilizar a ação toggle `Iniciar agendamento`, que transiciona o agendamento para `ATENDENDO`; depois de iniciado, o atendimento não volta para aguardando por este componente.
- Disponibilizar `Cancelar agendamento` somente enquanto o status for `AGENDADO`; a ação deve transicionar para `CANCELADO` e ficar desabilitada nos demais estados.
- Aplicar automaticamente `FALTA` quando passarem 10 minutos do horário de início sem transição para `ATENDENDO`; essa regra deve ser compatível com recarregamento e com a autoridade do backend.
- Manter ações e informações fora do primeiro incremento visíveis, porém desabilitadas, com a mensagem `Em breve`, incluindo concluir/atendida, editar agendamento, visualizar cadastro completo, observações e dados clínicos/contato ainda indisponíveis.
- Atualizar a agenda após uma transição confirmada e apresentar estados de carregamento e erro no modal, sem fechar silenciosamente diante de falha.

Fora de escopo: conclusão manual (`CONCLUIDO`/“Atendida”), edição ou remarcação, observações persistidas, cadastro completo do paciente, sala, dados de contato e clínicos, novos modos “Dia”/“Lista”, regras de autorização, alteração de tenant/unidade e criação de dados de paciente.

## Capabilities

### New Capabilities

Nenhuma. O comportamento pertence à agenda semanal existente.

### Modified Capabilities

- `weekly-appointments`: permitir abrir detalhes de um agendamento e executar as transições iniciais de status com as restrições temporais e de habilitação descritas nesta change.

## Impact

- Afeta `AppointmentsPage`, o cartão visual do agendamento, a feature `appointments` e seus testes de integração/modelo.
- Exige a mutação HTTP `PATCH /api/appointments/{id}/status` com `ATENDENDO` ou `CANCELADO` e resposta do agendamento atualizado, implementada pela change correspondente na API irmã.
- A regra automática de `FALTA` precisa ser persistida ou calculada pela API de forma autoritativa; o frontend pode exibir o estado e atualizar a consulta, mas não deve tratar um timer local como fonte definitiva.
- Não altera rotas, dependências ou o contrato mínimo de criação manual.
