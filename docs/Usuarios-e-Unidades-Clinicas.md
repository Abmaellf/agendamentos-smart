# Usuários e unidades clínicas

## Finalidade

Registra o contrato de associação entre usuários, clínicas e unidades clínicas (`clinic_unit`), além do impacto nas consultas de pacientes, agenda e identidade da aplicação.

## Regras de acesso

- Cada usuário não administrador é associado a uma unidade pertencente à sua própria clínica.
- `ADMIN` possui escopo em todas as unidades da sua clínica; a unidade associada é apenas o contexto padrão da sessão.
- Usuários não administradores possuem escopo apenas na unidade associada.
- A criação ou alteração da associação de um usuário exige administrador autenticado e unidade pertencente à clínica informada.

## Migração

A migração de dados associa cada usuário existente à unidade `MATRIZ` da sua clínica. Ela falha se existir usuário cuja clínica não possua uma MATRIZ, evitando vínculos entre clínicas diferentes.

## Contratos HTTP

### `GET /auth/me`

Além dos identificadores de clínica e unidade, a resposta fornece `clinicName` e `unitName`. Esses valores são usados no perfil e na marca lateral. A resposta não deve incluir senha, hash ou outro segredo.

### `GET /patient/list`

O endpoint exige autenticação.

- Para `ADMIN`, retorna pacientes da clínica autenticada.
- Para usuário não administrador, retorna pacientes vinculados somente à unidade associada.

O frontend utiliza esse endpoint como catálogo de pacientes; o antigo caminho `/api/patients` não deve ser usado para esse fluxo.

### `/api/appointments`

O servidor resolve o escopo usando o principal autenticado, não apenas o `unitId` enviado pelo cliente.

- Usuário não administrador só pode criar, listar e consultar agendamentos da unidade associada.
- `ADMIN` pode operar em qualquer unidade da própria clínica.
- Tentativas de consultar ou criar dados fora do escopo não podem expor registros da outra unidade ou clínica.

## Frontend

O parser de sessão aceita os campos opcionais `clinicName` e `unitName`. O perfil e a marca lateral mostram clínica e unidade quando disponíveis e mantêm estado explícito de indisponibilidade quando a resposta ainda não as contém.

## Estado de verificação

- Compilação da API: `./mvnw -q -DskipTests compile` aprovada após as alterações de backend.
- Teste da sidebar: `src/components/__tests__/app-sidebar.test.tsx` aprovado (6 testes).
- Testes de integração de API, testes completos do frontend e validação final das changes OpenSpec ainda precisam ser executados antes do encerramento da mudança.
