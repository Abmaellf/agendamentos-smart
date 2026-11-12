# Design

## Abordagem

- Alterar a validação de conflito em `AppointmentService` para consultar o nome/tipo do serviço antes da regra de profissional. A exclusividade será aplicada somente quando o serviço for `Atendimento individual`.
- Manter a contagem de ocupação por serviço e intervalo como limite final para serviços coletivos.
- Não confiar em validação exclusiva no frontend; a API continuará decidindo conflitos e capacidade.
- Preservar a distribuição de lanes já existente na agenda para exibir os cartões simultâneos em uma única linha.

## Compatibilidade e dados

Não há mudança de contrato de request, response, banco ou permissões. O código de erro existente para atendimento individual permanece compatível.

## Verificação

Adicionar testes cobrindo: serviço coletivo com mesmo profissional aceito, atendimento individual com mesmo profissional rejeitado, capacidade coletiva esgotada e conflito do paciente.
