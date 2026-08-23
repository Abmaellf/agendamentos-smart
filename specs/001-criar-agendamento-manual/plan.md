# Plano de implementação: Criar agendamento manual

**Branch**: `001-criar-agendamento-manual`  
**Spec de origem**: `specs/001-criar-agendamento-manual/spec.md`  
**Estratégia**: testes primeiro; nenhum código de produção da feature antes da conclusão dos testes de caixa branca e de caixa preta  
**Escopo principal**: front-end React/Vite, com contrato e testes de caixa preta da API como dependência externa obrigatória

## 1. Objetivo

Entregar a criação manual de um agendamento por usuários `ADMIN` e `BASIC`, com paciente, unidade, serviço, data, horário, duração, preço histórico e profissional opcional. O fluxo deve exibir o novo registro na agenda, respeitar permissões e apresentar de forma acionável as recusas produzidas pela API.

As regras de isolamento por tenant, conflito de paciente/profissional, capacidade e permissão de sobrescrita devem ser garantidas pela API. O front-end pode orientar e validar a entrada, mas não será a autoridade final dessas regras.

## 2. Estado atual relevante

- O projeto não possui runner, configuração ou arquivos de testes automatizados.
- O modal legado de agenda é apenas visual, não possui estado, validação ou integração HTTP.
- A antiga página de agenda e `CardDay` exibem agendamentos fixos criados durante a renderização.
- O contexto legado de pacientes não oferece um domínio funcional de agendamentos.
- O login não mantém um contexto tipado de sessão; a API usa cookie HTTP-only, mas o papel ainda não está disponível de forma confiável para a interface.
- O front-end usa `ADMIN`/`BASIC` na documentação, enquanto a API atual usa `ADMIN`/`USER`.
- A API atual expõe `POST /api/appointment`, mas seu contrato contém apenas paciente, patologia, data, hora, status e variante. Não há unidade, serviço, profissional, duração, preço, tenant, autoria, capacidade ou consultas por intervalo.
- A API atual não possui recursos de unidade, serviço ou profissional. Assim, a coleção Postman completa ficará vermelha até o contrato correspondente ser implementado no backend.

## 3. Decisões obrigatórias antes de escrever os testes

A spec permanece em `Draft` e possui três requisitos não resolvidos. Para evitar testes contraditórios, a etapa de refinamento deve registrar a decisão diretamente na spec antes da fase de testes.

| Tema                             | Decisão recomendada para o MVP                                                                               | Impacto nos testes                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Data/horário passado             | Bloquear para `ADMIN` e `BASIC`                                                                              | Validação do formulário e resposta HTTP de domínio               |
| Fuso horário                     | A unidade fornece um identificador IANA; a API persiste o instante normalizado e devolve também o fuso usado | Serialização do request, limites de dia e apresentação na agenda |
| Dia indisponível do profissional | Bloquear quando houver profissional selecionado                                                              | Validação definitiva na API e mensagem específica na UI          |

Também devem ser congelados antes dos testes:

- nomes e formatos dos endpoints de sessão, pacientes, unidades, serviços, profissionais e agendamentos;
- payload de criação e resposta canônica de agendamento;
- códigos HTTP e códigos estáveis de erro;
- forma de autenticação do Postman para `ADMIN` e `BASIC`;
- estratégia de dados isolados para execução local e CI;
- precisão monetária, unidade da duração e representação de data/hora;
- política para alteração de duração/preço por `BASIC`: recomenda-se rejeitar o request, sem criação silenciosa;
- precedência de erros: conflito de paciente antes de capacidade, conforme o edge case da spec.

Contrato mínimo recomendado para o comando de criação:

```json
{
  "patientId": "uuid",
  "unitId": "uuid",
  "serviceId": "uuid",
  "professionalId": "uuid-ou-null",
  "startsAt": "instante-ISO-8601",
  "durationMinutes": 60,
  "price": "150.00"
}
```

O request não deve aceitar `tenantId`, autor, instante de criação ou estado como fonte confiável; esses valores vêm da sessão e do servidor. A resposta deve conter os relacionamentos necessários para renderização, `status: "AGENDADO"`, snapshots de duração/preço, `createdBy` e `createdAt`.

Erros de domínio devem ter um envelope estável, por exemplo `code`, `message` e `fieldErrors`. Códigos mínimos: `PATIENT_SCHEDULE_CONFLICT`, `PROFESSIONAL_SCHEDULE_CONFLICT`, `SERVICE_CAPACITY_EXCEEDED`, `APPOINTMENT_OVERRIDE_FORBIDDEN`, `PROFESSIONAL_UNAVAILABLE_DAY` e um erro genérico que não revele recursos de outro tenant.

## 4. Arquitetura alvo no front-end

Criar um módulo de feature isolado, sem ampliar o contexto genérico de pacientes:

```text
src/
  features/appointments/
    api/appointments.ts
    components/create-appointment-dialog.tsx
    components/appointment-form.tsx
    hooks/use-appointments.ts
    hooks/use-create-appointment.ts
    model/appointment.ts
    model/appointment-form-schema.ts
    model/appointment-errors.ts
    pages/appointments-page.tsx
    __tests__/
  test/
    setup.ts
    server.ts
    handlers/
    builders/
postman/001-criar-agendamento-manual/
  criar-agendamento-manual.postman_collection.json
  local.postman_environment.example.json
  ci.postman_environment.example.json
  README.md
```

Responsabilidades:

- `model`: contratos canônicos, schema Zod e conversões entre valores do formulário e payload HTTP;
- `api`: funções HTTP tipadas, sem estado de tela;
- `hooks`: queries por tenant/unidade/intervalo, mutação, invalidação e normalização de erro;
- `components`: acessibilidade, campos, permissões, estados de envio e mensagens;
- `AppointmentsPage`: seleção de intervalo, abertura do diálogo e renderização dos dados recebidos;
- API/backend: autorização, tenant, snapshots, conflito, capacidade, concorrência, autoria e estado inicial.

## 5. Ordem obrigatória e gates

### Gate 0 — Spec e contrato aprovados

- Resolver as três clarificações.
- Aprovar o contrato HTTP e o catálogo de erros com o backend.
- Definir fixtures/seed reproduzíveis para dois tenants, usuários `ADMIN` e `BASIC`, pacientes, unidade, serviços com capacidades `1` e maior que `1`, e profissionais.
- Confirmar que a coleção será executada somente em ambiente local/CI dedicado; nunca contra produção.

**Saída**: spec sem `[NEEDS CLARIFICATION]`, exemplos de request/response e matriz de erros revisados.

### Gate 1 — Criar toda a suíte de caixa branca

Adicionar ao projeto:

- Vitest com ambiente `jsdom`;
- React Testing Library, `user-event` e `jest-dom`;
- MSW para simular a fronteira HTTP;
- cobertura V8;
- scripts `test`, `test:watch` e `test:coverage`;
- `setup.ts`, servidor MSW, builders de sessão e entidades, e utilitário de renderização com QueryClient/Router/Theme.

Os testes devem ser escritos antes dos arquivos de produção da feature. Eles podem iniciar vermelhos por módulos/comportamentos ausentes, mas devem ser completos, legíveis e não usar `skip`, `todo` ou asserts vazios para aparentar cobertura.

#### Casos de caixa branca

| ID    | Nível          | Comportamento esperado                                                                                                              |
| ----- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| WB-01 | Schema         | Paciente, unidade, serviço, data, horário e duração são obrigatórios; erros ficam associados aos campos corretos.                   |
| WB-02 | Schema         | Profissional é opcional e `null`/ausente é serializado conforme o contrato.                                                         |
| WB-03 | Schema         | Duração, preço e horário rejeitam formatos, limites e valores inválidos; preço não usa ponto flutuante impreciso.                   |
| WB-04 | Model          | Data e horário da unidade são convertidos para `startsAt` sem deslocamento indevido de fuso.                                        |
| WB-05 | Formulário     | Selecionar um serviço preenche duração e preço padrão.                                                                              |
| WB-06 | Formulário     | Trocar o serviço atualiza os padrões até que uma sobrescrita administrativa intencional seja feita.                                 |
| WB-07 | Permissão      | `ADMIN` pode editar duração/preço; `BASIC` vê os padrões sem controles editáveis e nunca envia uma sobrescrita.                     |
| WB-08 | Formulário     | Pacientes, unidades, serviços e profissionais exibem loading, erro, vazio e sucesso.                                                |
| WB-09 | Formulário     | Profissionais são filtrados pelo serviço/contexto permitido, sem tornar a seleção obrigatória.                                      |
| WB-10 | Formulário     | Submissão inválida não chama a API e mantém os demais valores digitados.                                                            |
| WB-11 | Mutação        | O payload contém somente IDs e valores autorizados, sem `tenantId`, estado, autor ou `createdAt` definidos pelo cliente.            |
| WB-12 | Mutação        | Enquanto o POST está pendente, o botão mostra progresso, fica desabilitado e cliques repetidos geram uma única chamada.             |
| WB-13 | Erros          | Cada erro estável de conflito, capacidade, permissão, tenant, indisponibilidade e validação produz mensagem específica e acionável. |
| WB-14 | Erros          | Falha de rede/erro desconhecido mostra fallback e preserva o formulário aberto com seus dados válidos.                              |
| WB-15 | Sucesso        | Em sucesso, o diálogo fecha, o formulário é limpo, a confirmação é exibida e as queries da agenda/capacidade são invalidadas.       |
| WB-16 | Agenda         | Após o refetch, o agendamento aparece uma única vez no dia/horário correto com estado, duração e preço retornados pela API.         |
| WB-17 | Agenda         | A agenda apresenta loading, erro com nova tentativa, vazio e dados, sem recorrer às fixtures atuais de `CardDay`.                   |
| WB-18 | Integração     | O botão “Novo agendamento” abre o diálogo na página e está disponível para sessão `ADMIN` e `BASIC` autenticada.                    |
| WB-19 | Integração     | Encerrar/cancelar o diálogo não envia request e o foco retorna ao disparador.                                                       |
| WB-20 | Acessibilidade | Labels, descrições de erro, foco inicial, navegação por teclado e anúncio de sucesso/falha são acessíveis.                          |
| WB-21 | Datas          | O comportamento de horário passado segue a decisão do Gate 0, sem substituir a validação definitiva da API.                         |
| WB-22 | Profissional   | O comportamento para dia indisponível segue o Gate 0 e a UI traduz a recusa definitiva do servidor.                                 |
| WB-23 | Sessão         | Papel, tenant e unidade ativa vêm da sessão tipada; senha nunca integra o modelo de perfil do front-end.                            |

Meta de cobertura: no mínimo 90% de linhas, statements e funções, e 85% de branches nos arquivos novos de `features/appointments`. O legado fora da feature não bloqueia essa meta inicial.

**Saída**: infraestrutura instalada, todos os arquivos de teste criados e execução vermelha documentada por falta da implementação, sem alterações de comportamento em `src`.

### Gate 2 — Criar toda a suíte de caixa preta no Postman

Versionar coleção Postman v2.1, exemplos de ambientes sem segredos e instruções de execução com Newman. Tokens, senhas reais e IDs locais não entram no Git. A coleção deve criar dados com um `runId` exclusivo ou consumir uma seed dedicada e fazer limpeza somente no ambiente de testes.

Adicionar scripts `test:postman` e `test:postman:race`. A suíte deve validar status HTTP, headers, schema, códigos de erro, efeitos persistidos e ausência de efeitos em recusas; não deve verificar apenas texto de mensagem.

#### Casos de caixa preta

| ID    | Cenário HTTP                                                                  | Resultado esperado                                                                                 |
| ----- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| BB-01 | Criar sem autenticação                                                        | `403` conforme o Spring Security atual; nenhum registro criado.                                    |
| BB-02 | `ADMIN` cria sem profissional em horário livre                                | `201`; um registro `AGENDADO`, padrões do serviço, unidade, autor e instante preenchidos.          |
| BB-03 | `BASIC` cria com os padrões                                                   | `201`; um registro `AGENDADO` com snapshots corretos.                                              |
| BB-04 | Omitir individualmente cada campo obrigatório                                 | `400/422` conforme contrato; código/field error correto e zero criação.                            |
| BB-05 | Enviar estado, autor ou tenant forjados                                       | Valores são rejeitados/ignorados conforme contrato e nunca ampliam o escopo da sessão.             |
| BB-06 | Referenciar paciente, unidade, serviço ou profissional de outro tenant        | Resposta genérica definida no contrato; nenhum dado externo é revelado e nada é criado.            |
| BB-07 | Sobrepor agendamento do mesmo paciente                                        | `409 PATIENT_SCHEDULE_CONFLICT`; agenda inalterada.                                                |
| BB-08 | Mesmo paciente e capacidade ainda livre                                       | O conflito de paciente prevalece; agenda inalterada.                                               |
| BB-09 | Sobrepor agendamento do mesmo profissional                                    | `409 PROFESSIONAL_SCHEDULE_CONFLICT`; agenda inalterada.                                           |
| BB-10 | Criar sem profissional onde existe conflito de outro profissional             | Criação permitida se paciente/capacidade estiverem livres.                                         |
| BB-11 | Início exatamente no término de outro compromisso                             | Criação permitida, comprovando intervalo semiaberto.                                               |
| BB-12 | Serviço de capacidade `1`, segunda ocupação sobreposta                        | `409 SERVICE_CAPACITY_EXCEEDED`; ocupação permanece `1`.                                           |
| BB-13 | Serviço com capacidade maior, até o limite                                    | Criações até o limite são aceitas; a próxima é recusada.                                           |
| BB-14 | Duas requisições simultâneas disputam a última vaga                           | Exatamente uma aceita e uma recusada; consulta final nunca supera a capacidade.                    |
| BB-15 | `ADMIN` sobrescreve apenas duração, apenas preço e ambos                      | `201`; valores informados ficam preservados no registro.                                           |
| BB-16 | `BASIC` tenta sobrescrever duração/preço                                      | Erro de permissão/validação acordado; nenhum valor fora do padrão é persistido.                    |
| BB-17 | Alterar os padrões do serviço após a criação                                  | Nova consulta mantém duração e preço históricos do agendamento.                                    |
| BB-18 | Repetir a confirmação enquanto a primeira está pendente                       | Uma única criação efetiva; a API continua protegida contra inconsistência concorrente.             |
| BB-19 | Data/horário passado                                                          | Resultado definido no Gate 0 para ambos os papéis.                                                 |
| BB-20 | Data/hora no fuso da unidade e em limite de dia                               | Instante persistido e devolvido sem mudança de data/hora local.                                    |
| BB-21 | Profissional em dia indisponível                                              | Resultado definido no Gate 0.                                                                      |
| BB-22 | Usuário autenticado sem papel operacional permitido                           | `403`; nenhum registro criado.                                                                     |
| BB-23 | Dados inválidos: duração, preço, capacidade de referência ou formato temporal | Erro estrutural/de domínio estável; nenhum registro criado.                                        |
| BB-24 | Consultar a agenda após sucesso                                               | Exatamente o novo compromisso aparece no intervalo/unidade do tenant; outro tenant não o encontra. |

Para BB-14, o runner deve disparar as duas chamadas realmente em paralelo, capturar ambos os resultados e depois consultar a ocupação final. Uma repetição sequencial não comprova a condição de corrida.

**Saída**: coleção, ambientes de exemplo, runner Newman e relatório vermelho/verde por cenário. Neste ponto, todos os testes previstos para a feature existem.

### Gate 3 — Revisão test-first

Antes de implementar código de produção:

- conferir que todos os acceptance scenarios, edge cases e FRs possuem teste associado;
- revisar os testes com produto e backend;
- registrar o baseline vermelho esperado;
- confirmar que nenhuma regra de conflito/capacidade foi atribuída apenas ao React;
- proibir mudanças nos resultados esperados durante a implementação, salvo correção formal da spec/contrato.

Somente a aprovação deste gate libera a implementação.

## 6. Implementação após todos os testes existirem

### Fase I — Contratos e sessão

1. Criar tipos canônicos de `Appointment`, `Patient`, `Unit`, `Service`, `Professional`, `UserRole` e erros.
2. Corrigir o modelo de perfil para `ADMIN | BASIC`, remover senha das respostas consumidas e disponibilizar tenant/unidade ativa em um hook de sessão.
3. Padronizar autenticação da instância Axios e tratamento de `401/403` sem duplicar credenciais em estado React.

### Fase II — Camada de dados

1. Implementar funções tipadas de listagem dos cadastros e agenda por intervalo/unidade.
2. Implementar `createAppointment` com transformação explícita de data, duração e valor monetário.
3. Implementar query keys que incluam tenant, unidade e intervalo visível.
4. Implementar mutação com invalidação da agenda e de ocupação/capacidade afetadas.
5. Normalizar erros HTTP para o catálogo usado nos testes, sem comparar mensagens livres.

### Fase III — Formulário de criação

1. Criar `CreateAppointmentDialog` como diálogo controlado e acessível e remover o modal legado.
2. Carregar paciente, unidade, serviço e profissional pelos hooks da feature.
3. Preencher duração/preço ao selecionar serviço e aplicar a permissão de edição por papel.
4. Combinar data e horário conforme o fuso da unidade.
5. Impedir duplo submit, exibir andamento e manter dados após erro.
6. Traduzir validações locais e erros de domínio da API em feedback de campo/formulário.

### Fase IV — Agenda real

1. Renderizar o disparador na página `AppointmentsPage`.
2. Buscar a agenda do intervalo semanal selecionado.
3. Remover os agendamentos construídos em memória em `CardDay` e receber registros tipados por props.
4. Exibir estados de loading, erro, vazio e sucesso em desktop e mobile.
5. Após criação, atualizar a semana consultada e garantir renderização única do novo compromisso.

### Fase V — Backend dependente

Esta fase ocorre no repositório da API, mas é requisito para os testes Postman e para a entrega funcional:

1. Alinhar papéis `ADMIN`/`BASIC` e derivar usuário/tenant da autenticação.
2. Criar/adequar entidades e migrations de unidade, serviço, profissional e agendamento.
3. Preservar snapshots de duração/preço, estado inicial, autor e timestamps.
4. Aplicar pertencimento ao tenant em todas as referências sem vazar existência externa.
5. Implementar conflitos por intervalos semiabertos e capacidade dentro de uma transação.
6. Proteger a última vaga com lock/constraint/isolamento apropriado; um `count` fora da transação não é suficiente.
7. Restringir sobrescritas a `ADMIN` e expor erros de domínio estáveis.
8. Expor consulta de agenda por unidade e intervalo para o refetch do front-end.

## 7. Rastreabilidade

| Requisitos             | Evidência principal                                                              |
| ---------------------- | -------------------------------------------------------------------------------- |
| FR-001, FR-013, FR-014 | WB-07, WB-18, BB-02, BB-03, BB-15, BB-16, BB-22                                  |
| FR-002, FR-003, FR-004 | WB-01, WB-02, WB-05, BB-02, BB-04                                                |
| FR-005, FR-006, FR-007 | WB-16, BB-02, BB-03, BB-17, BB-24                                                |
| FR-008, FR-015         | WB-11, WB-23, BB-05, BB-06, BB-24                                                |
| FR-009, FR-010, FR-012 | WB-13, BB-07, BB-08, BB-09, BB-10, BB-11                                         |
| FR-011                 | BB-12, BB-13, BB-14                                                              |
| FR-016, FR-017, FR-018 | WB-12 a WB-17, BB-18, BB-24                                                      |
| FR-019, FR-020, FR-021 | WB-04, WB-21, WB-22, BB-19, BB-20, BB-21                                         |
| SC-002 a SC-006        | Coleção Postman BB-06 a BB-17 e BB-24                                            |
| SC-001                 | Sessão separada de teste de usabilidade; não é demonstrada por Vitest ou Postman |

## 8. Validação final e definição de pronto

Executar, nesta ordem:

1. `npm run lint`;
2. `npm run build`;
3. `npm run test:coverage`;
4. `npm run test:postman`;
5. `npm run test:postman:race` com repetições suficientes para detectar flakiness;
6. teste exploratório desktop/mobile e navegação somente por teclado;
7. teste de usabilidade de SC-001 com usuários representativos e medição de tempo/sucesso.

A feature só está pronta quando:

- todos os testes brancos e pretos estão verdes, sem skips;
- cobertura dos arquivos novos atinge a meta;
- nenhum compromisso conflitante ou acima da capacidade é persistido;
- isolamento por tenant e permissões são comprovados no servidor;
- o agendamento criado aparece uma única vez na agenda;
- loading, erro, vazio e sucesso estão implementados;
- documentação do contrato e instruções Postman estão atualizadas;
- as três decisões antes pendentes constam na spec.

## 9. Fora do escopo

- recorrência, remarcação, cancelamento, confirmação, início, conclusão e falta;
- disponibilidade intradiária, férias, salas e equipamentos;
- múltiplas unidades efetivamente operáveis além da unidade inicial;
- testes E2E do navegador. Postman é caixa preta da API; se for necessário validar a aplicação completa pelo navegador, criar uma feature posterior com Playwright.
