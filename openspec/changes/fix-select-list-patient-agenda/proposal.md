# Proposal

## Why

O cadastro de paciente grava os vínculos em `unitIds`, mas o diálogo de novo agendamento consulta `GET /patient/list` sem considerar a unidade selecionada e carrega pacientes antes da escolha de unidade. Para `ADMIN` em clínicas com múltiplas unidades, isso pode esconder um paciente recém-criado, exibir pacientes de outra unidade ou permitir uma combinação inválida entre paciente e unidade, como evidenciado pelas telas `NOVO1-PACIENTE.jpg`, `AGENDAMENTO-PACIENTE1.jpg` e `UNIDADE_ADMIN_MULTI_UNIDADEjpg.jpg`.

## What Changes

- Fazer a seleção de Unidade ser o primeiro passo do catálogo no diálogo de agendamento para `ADMIN`.
- Manter o campo Paciente desabilitado até que uma unidade válida seja selecionada; depois disso, carregar somente pacientes vinculados àquela unidade.
- Reconsultar o catálogo de pacientes quando `ADMIN` trocar de unidade, limpar a seleção anterior de paciente e impedir o envio de uma combinação que ficou obsoleta.
- Usar um contrato de catálogo de pacientes que receba a unidade escolhida e tenha filtragem/enforcement no servidor por clínica, unidade e papel; o frontend não será a autoridade de autorização.
- Garantir que `BASIC` continue usando `activeUnitId` e receba somente os pacientes da unidade autorizada, sem seleção arbitrária de unidade.
- Preservar o payload de criação de agendamento (`patientId` e `unitId`), o cadastro de pacientes com `unitIds`, a busca textual local sobre o catálogo já recebido e os demais campos do formulário.
- Cobrir catálogo vazio, erro, troca de unidade, paciente recém-criado vinculado à unidade selecionada e tentativa de selecionar paciente de outra unidade.

Fora de escopo: redesenhar o cadastro de pacientes, alterar o modelo persistido de vínculos, criar um seletor de unidade para `BASIC`, mudar regras de tenant/autorização fora do contrato necessário, filtrar autorização somente no navegador ou alterar duração, preço, profissionais e regras de conflito do agendamento.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `weekly-appointments`: a criação manual passa a exigir a unidade antes do paciente e a oferecer um catálogo de pacientes escopado pela unidade selecionada.

## Impact

- Frontend: `CreateAppointmentDialog`, query/modelo do catálogo de pacientes, tipos de opções, mocks e testes de integração da agenda.
- API coordenada: confirmar/adotar o endpoint de catálogo apropriado para agendamento (o checkout atual usa `GET /patient/list`, enquanto o backend irmão já expõe `GET /api/patients`) e acrescentar o filtro de `unitId` para `ADMIN`, com validação server-side da unidade na clínica autenticada.
- Cache: a chave da consulta de pacientes deverá incluir `unitId`, para que a troca de unidade não reutilize uma lista anterior.
- Rotas de tela, banco de dados e payload de criação não mudam; a mudança de contrato é limitada à consulta de catálogo e deve ser coordenada com a API antes da implementação.
