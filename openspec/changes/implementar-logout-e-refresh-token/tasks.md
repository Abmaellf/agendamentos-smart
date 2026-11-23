# Tasks

## 1. Infraestrutura de sessão HTTP

- [x] 1.1 Criar o cliente de sessão compartilhado para chamar `/auth/refresh` com credenciais, proteger a chamada contra retry recursivo e verificar o comportamento com refresh aceito e rejeitado nos testes unitários da camada HTTP.
- [x] 1.2 Integrar a renovação de `401` à base query do RTK Query, repetindo cada requisição elegível no máximo uma vez e verificando o resultado com `npm run test -- src/lib/__tests__/axios-base-query.test.ts`.
- [x] 1.3 Implementar o controle single-flight para refresh concorrente e o evento de sessão expirada, verificando que várias requisições expiradas geram uma única chamada a `/auth/refresh` e não entram em loop.

## 2. Logout e bootstrap da aplicação

- [x] 2.1 Adicionar a mutation de `POST /auth/logout` e conectar a opção “Sair” do menu de conta para limpar o cache RTK Query, fechar o menu, navegar a `/sign-in` e exibir feedback; verificar sucesso e falha em `src/components/__tests__/app-topbar.test.tsx` ou teste equivalente.
- [x] 2.2 Alterar `FirstScreen` para validar `/auth/me` pela camada de sessão, aguardar o bootstrap e encaminhar para `/appointments` ou `/sign-in`; verificar os dois destinos com handlers MSW.
- [x] 2.3 Garantir que login, refresh, logout e expiração não gravem tokens em armazenamento acessível ao JavaScript e atualizar os READMEs de `src/api`, `src/page/auth` e componentes afetados; verificar com busca textual e revisão dos testes.

## 3. Verificação integrada do frontend

- [x] 3.1 Atualizar handlers e fixtures MSW para `/auth/refresh` e `/auth/logout`, cobrindo sessão válida, refresh inválido, logout idempotente, retry único e acesso à rota após logout; verificar com `npm run test:coverage`.
- [x] 3.2 Executar `npm run lint` e `npm run build`, registrar no change qualquer falha preexistente e confirmar que o fluxo visual do botão “Sair” permanece acessível em viewport ampla e compacta.

## Workflow follow-up

- Verificações: `npm run test` aprovou 161 testes; o recorte final do fluxo de sessão aprovou 14 testes. `npm run lint` e `npm run build` passaram.
- `npm run test:coverage` executou 160 testes aprovados, mas retornou código 1 porque o threshold global preexistente de branches é 85% e a medição atual é 77,69%; não houve falha funcional de teste.

- Validar a change com `openspec validate implementar-logout-e-refresh-token --strict`.
- Aplicar o backend e o frontend em ordem coordenada antes de arquivar as changes.
