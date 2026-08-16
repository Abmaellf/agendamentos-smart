# Como executar os testes — Criar agendamento manual

Este guia executa os testes do front-end e as coleções Postman/Newman contra a API local em `http://localhost:8082`.

## 1. Pré-requisitos

- Node.js compatível com `.nvmrc` e npm instalados;
- Java 21 e Maven Wrapper disponíveis no repositório do backend;
- MySQL local acessível pelas variáveis do backend;
- porta `8082` livre para a API;
- diretório do front-end:
  `/home/abmael/workspace/01-MEUS-PROJETOS-OFICIAIS-PRD-TEST/5-agendamentos-smart/agendamento-smart-web/agendamentos-smart`;
- diretório do backend:
  `/home/abmael/workspace/01-MEUS-PROJETOS-OFICIAIS-PRD-TEST/5-agendamentos-smart/api-agendamento-smart-api/agendamento-smart-api`.

As dependências usadas são Vitest, React Testing Library, MSW e Newman. Instale-as pelo lockfile:

```bash
cd /home/abmael/workspace/01-MEUS-PROJETOS-OFICIAIS-PRD-TEST/5-agendamentos-smart/agendamento-smart-web/agendamentos-smart
npm ci
```

## 2. Iniciar a API em `localhost:8082`

Abra outro terminal:

```bash
cd /home/abmael/workspace/01-MEUS-PROJETOS-OFICIAIS-PRD-TEST/5-agendamentos-smart/api-agendamento-smart-api/agendamento-smart-api
set -a
source .env
set +a
./mvnw spring-boot:run
```

Aguarde o Spring informar que a aplicação iniciou na porta `8082`.

Verificação rápida:

```bash
curl -i \
  -H 'Content-Type: application/json' \
  -d '{"login":"admin@agendasmart.com","password":"Admin@123"}' \
  http://localhost:8082/auth/login
```

O resultado esperado é HTTP `200`.

## 3. Credenciais e usuário operacional

O environment local já está configurado com:

```text
baseUrl: http://localhost:8082
clinicId: 550e8400-e29b-41d4-a716-446655440000
ADMIN: admin@agendasmart.com / Admin@123
USER: usuario1@agendasmart.com / usuario1@123
```

No código atual do backend, `USER` é o papel equivalente ao `BASIC` descrito na spec.

Para criar manualmente o USER, caso necessário:

1. Faça login do ADMIN e copie o campo `token` da resposta.
2. Execute:

```bash
curl -i \
  -H 'Authorization: Bearer SEU_TOKEN_ADMIN' \
  -H 'Content-Type: application/json' \
  -d '{"login":"usuario1@agendasmart.com","password":"usuario1@123","role":"USER"}' \
  http://localhost:8082/user/register/550e8400-e29b-41d4-a716-446655440000
```

O endpoint atual retorna HTTP `200` sem corpo. Se o login já existir, não repita o cadastro. O comando automatizado da próxima seção faz essa verificação antes de criar.

## 4. Executar o smoke test do backend atual

No diretório do front-end:

```bash
npm run test:postman:smoke
```

Esse comando:

1. autentica `admin@agendasmart.com`;
2. confirma o `clinicId`;
3. consulta os usuários e cria `usuario1@agendasmart.com` somente se estiver ausente;
4. autentica o USER;
5. testa `GET /auth/me` com Bearer token;
6. consulta um agendamento seed pelo contrato legado.

Baseline observado em 13 de agosto de 2026:

```text
5 requests executados
10 assertions aprovadas
0 falhas
```

O smoke também documenta um débito existente: `/auth/me` ainda devolve o campo `password`.

Para executar somente autenticação/provisionamento:

```bash
npm run test:postman:setup
```

Baseline observado:

```text
3 requests executados
4 assertions aprovadas
0 falhas
```

## 5. Executar testes de caixa branca do React

```bash
npm test
```

Para modo contínuo:

```bash
npm run test:watch
```

Para cobertura:

```bash
npm run test:coverage
```

Estado esperado antes da implementação:

- `52` casos coletados;
- `52` falhas intencionais;
- `WB-01` a `WB-23` cobertos;
- os módulos de produção da feature ainda não existem;
- a página atual ainda usa fixtures e não integra o novo diálogo/API.

Essas falhas constituem o baseline test-first. Elas não devem ser mascaradas com `skip` ou `todo`.

## 6. Executar a coleção do contrato da feature

```bash
npm run test:postman
```

O script força `baseUrl=http://localhost:8082`, mesmo que o environment seja editado.

Situação esperada no backend atual:

- login e provisionamento passam;
- `BB-01` passa esperando o `403` atualmente devolvido pelo Spring para uma criação sem autenticação;
- os demais cenários ficam vermelhos porque o backend ainda usa o DTO legado de agendamento.

O contrato futuro espera:

```json
{
  "patientId": "uuid",
  "unitId": "uuid",
  "serviceId": "uuid",
  "professionalId": null,
  "startsAt": "2035-08-20T12:30:00.000Z",
  "durationMinutes": 60,
  "price": "150.00"
}
```

O backend atual recebe `pathology`, `dateScheduling`, `hours`, `status` e `variant`, retorna `200` na criação e ainda não possui unidade, serviço, profissional, preço, capacidade, tenant ou autoria no agendamento. Portanto, não altere os asserts da feature apenas para fazê-los passar contra o DTO legado.

## 7. Executar os testes de concorrência

```bash
npm run test:postman:race
```

Essa coleção exige a seed futura documentada em [README do Postman](../../postman/001-criar-agendamento-manual/README.md):

- serviço de capacidade `3`;
- `raceSlot` inicialmente com duas vagas ocupadas;
- dois pacientes livres disputando a última vaga;
- suporte ao header `Idempotency-Key`.

Ela dispara as duas requisições em paralelo e depois consulta a ocupação final. No backend atual, é esperado que permaneça vermelha.

Baseline observado: o login ADMIN passou; a consulta de pré-condição e as duas criações simultâneas receberam `403`, confirmando que o contrato necessário ainda não está disponível.

## 8. Executar verificações auxiliares

```bash
npm run build
npm run lint
```

O build estava verde ao registrar este guia. O lint global pode revelar débitos existentes fora dos arquivos da feature; para verificar apenas a infraestrutura nova:

```bash
npx eslint \
  vitest.config.ts \
  src/test \
  src/features/appointments/__tests__ \
  src/features/session/__tests__ \
  src/page/Scheduling/scheduling.integration.test.tsx
```

## 9. Importar no aplicativo Postman

Importe os seguintes arquivos:

- `postman/001-criar-agendamento-manual/backend-atual-smoke.postman_collection.json`;
- `postman/001-criar-agendamento-manual/criar-agendamento-manual.postman_collection.json`;
- `postman/001-criar-agendamento-manual/concorrencia-ultima-vaga.postman_collection.json`;
- `postman/001-criar-agendamento-manual/local.postman_environment.json`.

Selecione o environment “Criar agendamento manual - local” e confirme `baseUrl = http://localhost:8082` antes de executar.

## 10. Interpretação dos resultados

| Comando                      | Resultado atual esperado                                                 |
| ---------------------------- | ------------------------------------------------------------------------ |
| `npm run test:postman:smoke` | Verde: backend, login e contrato legado disponíveis                      |
| `npm run test:postman:setup` | Verde: ADMIN e USER autenticados/provisionados                           |
| `npm test`                   | Vermelho: implementação React ainda ausente                              |
| `npm run test:postman`       | Vermelho após os checks iniciais: contrato novo ainda ausente no backend |
| `npm run test:postman:race`  | Vermelho: capacidade/idempotência ainda ausentes                         |
| `npm run build`              | Verde                                                                    |

Depois que a implementação for autorizada, o objetivo será tornar gradualmente verdes as suítes branca e de contrato, mantendo o smoke legado como diagnóstico até sua substituição pelo contrato canônico.
