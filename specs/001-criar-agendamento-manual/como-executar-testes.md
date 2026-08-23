# Como executar os testes — Criar agendamento manual

Este é o roteiro validado para subir o ambiente completo e executar os testes React e Postman da feature. A API deve responder em `http://localhost:8080` e o front-end em `http://localhost:3000`.

## 1. Preparar uma base descartável

As coleções usam UUIDs e horários determinísticos e persistem os agendamentos criados. Para uma execução completa repetível, comece com o volume Docker descartável restaurado pela migration `V006__manual_appointment_contract.sql`.

No backend:

```bash
cd /home/abmael/workspace/01-MEUS-PROJETOS-OFICIAIS-PRD-TEST/5-agendamentos-smart/api-agendamento-smart-api/agendamento-smart-api
docker compose down -v
docker compose up -d --build
docker compose ps
```

`docker compose down -v` apaga os dados do MySQL desse Compose. Não execute esse passo se o volume contiver dados que devam ser preservados; nesse caso, use outro projeto/volume local ou uma base dedicada de CI.

Em uma base já limpa, basta:

```bash
docker compose up -d --build
```

Verifique a inicialização e a aplicação das migrations:

```bash
docker compose logs -f api
```

O ambiente está pronto quando aparecer `Started AgendaSmartApplication`. Se o contêiner da API tiver sido criado durante uma colisão temporária da porta `8080` e ficar fora da rede, preserve o banco e recrie apenas a API:

```bash
docker compose stop api
docker compose up -d --force-recreate api
```

## 2. Preparar e subir o front-end

Em outro terminal:

```bash
cd /home/abmael/workspace/01-MEUS-PROJETOS-OFICIAIS-PRD-TEST/5-agendamentos-smart/agendamento-smart-web/agendamentos-smart
npm ci
npm run dev -- --host 0.0.0.0
```

O arquivo `.env.local` deve conter:

```dotenv
VITE_API_URL="http://localhost:8080"
```

Acesse `http://localhost:3000`.

## 3. Credenciais locais

```text
clinicId: 550e8400-e29b-41d4-a716-446655440000
ADMIN: admin@agendasmart.com / Admin@123
USER (BASIC na spec): usuario1@agendasmart.com / usuario1@123
```

O setup consulta `GET /auth/list` e, se necessário, cria o usuário pelo endpoint `POST /user/register/{clinicId}` com:

```json
{
  "login": "usuario1@agendasmart.com",
  "password": "usuario1@123",
  "role": "USER"
}
```

## 4. Executar as verificações

No backend:

```bash
./mvnw test
```

No front-end, execute nesta ordem:

```bash
npm run lint
npm run build
npm run test:coverage
npm run test:postman:smoke
npm run test:postman:setup
npm run test:postman
npm run test:postman:race
```

Os scripts Newman forçam `baseUrl=http://localhost:8080`, independentemente do valor salvo no environment.

Resultados de referência da implementação em 15 de agosto de 2026:

| Comando                 | Resultado esperado                        |
| ----------------------- | ----------------------------------------- |
| `./mvnw test`           | `BUILD SUCCESS`                           |
| `npm run lint`          | sem erros                                 |
| `npm run build`         | build Vite concluído                      |
| `npm run test:coverage` | 52/52 casos; 95,83% statements; 96% lines |
| `test:postman:smoke`    | 5 requests; 10 assertions; 0 falhas       |
| `test:postman:setup`    | autenticação/provisionamento sem falhas   |
| `test:postman`          | 42 requests; 44 assertions; 0 falhas      |
| `test:postman:race`     | 9 requests; 12 assertions; 0 falhas       |

Na corrida BB-14, o resultado correto é exatamente uma criação `201` e uma recusa `409`. No BB-18, as duas respostas devem ser `200/201`, possuir o mesmo ID e resultar em um único registro.

## 5. Executar pelo aplicativo Postman

Importe:

- `postman/001-criar-agendamento-manual/backend-atual-smoke.postman_collection.json`;
- `postman/001-criar-agendamento-manual/criar-agendamento-manual.postman_collection.json`;
- `postman/001-criar-agendamento-manual/concorrencia-ultima-vaga.postman_collection.json`;
- `postman/001-criar-agendamento-manual/local.postman_environment.json`.

Selecione o environment “Criar agendamento manual - local”. O BB-01 limpa o cookie do runner antes de testar a criação sem autenticação; as solicitações seguintes usam explicitamente os Bearer tokens obtidos no setup.

## 6. Encerrar o ambiente

Para encerrar apenas a API e o banco, preservando o volume:

```bash
cd /home/abmael/workspace/01-MEUS-PROJETOS-OFICIAIS-PRD-TEST/5-agendamentos-smart/api-agendamento-smart-api/agendamento-smart-api
docker compose stop
```

Encerre o Vite com `Ctrl+C` no terminal em que ele estiver executando.
