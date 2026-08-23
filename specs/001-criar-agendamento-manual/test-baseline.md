# Baseline test-first: Criar agendamento manual

**Data**: 2026-08-13  
**Estado**: aguardando validação antes de qualquer implementação  
**Escopo alterado**: dependências/configurações de teste, testes automatizados, mocks MSW e coleções Postman; nenhum código de produção da feature foi implementado

## Decisões provisórias codificadas nos testes

Como a spec ainda contém clarificações, os testes adotam provisoriamente as recomendações do plano. Elas precisam ser aprovadas ou corrigidas antes de iniciar a implementação:

1. `ADMIN` e `BASIC` não podem criar agendamentos no passado.
2. A unidade usa identificador IANA; os fixtures usam `America/Cuiaba`, e o comando envia um instante ISO normalizado.
3. Selecionar profissional em dia indisponível bloqueia a criação.
4. Tentativa de sobrescrita por `BASIC` é recusada, sem persistência silenciosa dos padrões.
5. O comando usa `POST /api/appointment` e não aceita tenant, estado, autor ou timestamps como fonte confiável do cliente.
6. BB-18 usa `Idempotency-Key`: duas confirmações simultâneas representam o mesmo resultado e geram um único registro.

## Caixa branca

- Ferramentas: Vitest, jsdom, React Testing Library, user-event, jest-dom e MSW.
- Contratos cobertos: `WB-01` a `WB-23`.
- Casos concretos coletados: `52`.
- Skips/todos: `0`.
- Comando: `npm test`.
- Resultado esperado atual: `4` arquivos vermelhos, `52` casos vermelhos.

Razões do vermelho:

- `appointment-form-schema.ts`, `create-appointment-dialog.tsx` e o contrato de sessão ainda não existem;
- a antiga página de agenda ainda não consulta a API, não apresenta loading/erro/vazio e não abre o diálogo;
- `CardDay` ainda usa agendamentos fixos.

A execução também revelou débitos do código atual que serão tratados somente após aprovação: chaves React ausentes, botão dentro de botão no seletor de data e propriedade visual propagada ao DOM.

## Caixa preta

- Ferramentas: Postman Collection v2.1 e Newman.
- Cenários cobertos: `BB-01` a `BB-24`.
- Coleções: fluxo funcional/contrato e runner separado de concorrência/idempotência.
- Skips: `0`.
- Validação estrutural: todas as coleções e environments foram carregados com sucesso por `postman-collection`.
- Comandos: `npm run test:postman` e `npm run test:postman:race`.
- A API foi confirmada em `localhost:8080`: login/setup e smoke do contrato atual estão verdes; as coleções da feature seguem vermelhas porque o contrato novo ainda não foi implementado.

Baseline real observado:

- setup: `3` requests, `4` assertions, `0` falhas;
- smoke atual: `5` requests, `10` assertions, `0` falhas;
- coleção da feature sem `--bail`: `35` requests e `30` assertions falharam após os checks de autenticação; os comandos de agendamento com o payload novo recebem `403` no backend atual;
- concorrência: o login passou, mas a pré-condição de listagem e as duas criações paralelas receberam `403`; resultado esperado enquanto capacidade/idempotência não existem;
- o endpoint legado foi confirmado separadamente: `POST /api/appointment` recebe `pathology`, `dateappointment`, `hours`, `status` e `variant` e retorna `200`.

O runner de corrida dispara as requisições em paralelo e consulta a ocupação final. A coleção principal também verifica isolamento de tenant, snapshots, intervalos adjacentes, precedência do conflito de paciente, permissões, campos derivados e visibilidade posterior.

## Verificações que estão verdes

- ESLint aplicado somente aos novos arquivos de teste/configuração.
- `npm run build`.
- Parsing e instanciação das duas coleções e dos environments Postman.
- Presença de todos os identificadores `WB-01..WB-23` e `BB-01..BB-24`.

## Gate de validação

A implementação permanece bloqueada por decisão de processo até aprovação explícita deste baseline. A validação deve confirmar:

- as seis decisões provisórias acima;
- os seletores/mensagens observáveis definidos nos testes da interface;
- o contrato HTTP, códigos de erro e seed descritos no README do Postman;
- a autorização para iniciar os módulos de produção e tornar a suíte gradualmente verde.

## Resultado após a validação e implementação

**Data**: 2026-08-15
**Estado**: implementado e validado

- caixa branca: `52/52` casos verdes;
- cobertura: `95,83%` de statements e `96%` de linhas nos módulos instrumentados;
- contrato Postman: `42` requests e `44` assertions verdes;
- concorrência/idempotência: `9` requests e `12` assertions verdes;
- compatibilidade legada: smoke com `5` requests e `10` assertions verdes;
- build, lint e testes Maven verdes.

O histórico vermelho acima permanece no documento para registrar o gate test-first original.
