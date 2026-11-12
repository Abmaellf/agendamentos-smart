# Proposal

## Why

A agenda precisa suportar atendimentos em grupo, como turmas de Pilates, para que pacientes distintos possam ocupar o mesmo intervalo quando ainda houver vagas. O protótipo evidencia essa necessidade ao mostrar vários cartões independentes no mesmo horário, preservando a identificação de cada paciente.

## What Changes

- Permitir a criação de agendamentos simultâneos para pacientes distintos no mesmo serviço, unidade e intervalo quando a API confirmar que há capacidade disponível.
- Manter o bloqueio de sobreposição do mesmo paciente e de profissional já alocado, além da rejeição quando a capacidade do serviço for atingida; essas regras permanecem responsabilidade da API.
- Tornar explícita na experiência de criação a possibilidade de reservar uma vaga em um horário já ocupado, tratando o sucesso e as recusas de capacidade/conflito retornadas pela API.
- Apresentar todos os pacientes aceitos no mesmo intervalo como cartões separados, lado a lado, com nome, serviço e estado legíveis, conforme o protótipo.

Fora de escopo: criar ou editar a capacidade dos serviços, substituir a validação de conflito/capacidade feita pela API, alterar papéis e permissões, mudar os campos do `POST /api/appointments`, ou implementar visualizações de dia/lista.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `weekly-appointments`: permite agendamentos simultâneos de pacientes distintos condicionados à capacidade confirmada pela API e define sua criação e apresentação na agenda semanal.

## Impact

- Código potencialmente afetado: formulário e diálogo de criação, mapeamento de erros HTTP, modelo da grade semanal, página da agenda e respectivos testes/fixtures.
- Contrato HTTP: não há novo endpoint nem campo de payload; a interface continuará enviando um agendamento por paciente e interpretará a aceitação, conflitos e limite de capacidade retornados pela API externa.
- Dados e permissões: não há migração nem mudança de autorização; capacidade, conflito de paciente e conflito de profissional continuam regras autoritativas do backend.
- Esta change deverá ser reconciliada com a change ativa `alinhar-tela-agendamento-resposta-backend`, pois ambas modificam a capability `weekly-appointments`.
