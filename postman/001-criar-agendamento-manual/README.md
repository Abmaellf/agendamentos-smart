# Testes Postman — criar agendamento manual

Esta pasta contém três coleções de caixa preta apontadas explicitamente para `http://localhost:8082` pelos scripts npm:

- `backend-atual-smoke`: confirma que a API está disponível, autentica os usuários e documenta o contrato legado que funciona hoje;
- `criar-agendamento-manual`: descreve o contrato esperado da feature (`BB-01` a `BB-24`);
- `concorrencia-ultima-vaga`: valida concorrência e idempotência (`BB-14` e `BB-18`).

## Contrato exercitado

- autenticação: `POST /auth/login`;
- cadastro idempotente do usuário operacional: `GET /auth/list` e, se necessário, `POST /user/register/:clinicId`;
- criação: `POST /api/scheduling`;
- consulta da agenda: `GET /api/scheduling?unitId&from&to`;
- consulta unitária: `GET /api/scheduling/:id`;
- alteração do serviço usada para provar snapshot: `PUT /api/services/:id`.

O comando de criação aceita `patientId`, `unitId`, `serviceId`, `professionalId`, `startsAt`, `durationMinutes` e `price`. Tenant, autor, instante de criação e estado são sempre derivados pelo servidor.

## Preparação do ambiente

O environment local já contém:

- `baseUrl`: `http://localhost:8082`;
- `clinicId`: `550e8400-e29b-41d4-a716-446655440000`;
- ADMIN: `admin@agendasmart.com` / `Admin@123`;
- USER de teste: `usuario1@agendasmart.com` / `usuario1@123`.

O backend atual chama o papel operacional de `USER`; nos requisitos da feature ele corresponde a `BASIC`. O setup consulta `/auth/list` e só chama `/user/register/{{clinicId}}` quando esse usuário ainda não existe, evitando falha por duplicidade.

Para executar a coleção completa da feature, use apenas uma base descartável local/CI e restaure a seed antes de cada execução. Além da clínica e dos usuários, a seed futura deve fornecer:

- usuários `ADMIN`, `BASIC`, um usuário autenticado sem papel operacional e um administrador de outro tenant;
- os IDs declarados no environment para dois tenants;
- serviços com capacidade `1`, capacidade `3` e um serviço mutável;
- conflitos previamente preparados nos slots `patientConflictSlot`, `professionalConflictSlot` e `capacityOneSlot`;
- `raceSlot` com duas das três vagas ocupadas; `capacityThreeSlot` começa vazio;
- `patientConflictSlot` ainda com capacidade livre, para provar a precedência do conflito de paciente;
- profissional indisponível no dia de `unavailableProfessionalSlot`;
- agendamentos de conflito com duração de 60 minutos, permitindo o teste adjacente.

Tokens são obtidos durante a execução e não são persistidos no arquivo. Os UUIDs de unidade, serviço e profissional são exemplos determinísticos do contrato futuro; esses recursos ainda não existem na API atual.

## Execução

```bash
npm run test:postman:smoke
npm run test:postman:setup
npm run test:postman
npm run test:postman:race
```

Use `test:postman:smoke` primeiro. Ele deve ficar verde no backend atual. `test:postman:setup` executa somente autenticação e provisionamento idempotente do USER.

`test:postman:race` dispara duas criações simultâneas para a última vaga e duas confirmações simultâneas com a mesma chave de idempotência. Execução sequencial não satisfaz BB-14/BB-18.

## Resultado esperado nesta etapa

O smoke atual deve ficar verde. As coleções da feature permanecem vermelhas até o backend implementar o contrato da spec. Nenhum teste está desabilitado.
