# Design

## Context

Consulte `proposal.md` e o delta `specs/legacy-patient-management/spec.md` para a motivação e o comportamento-alvo. Hoje o backend já possui `Patient.clinic`, a associação `PATIENT_UNIT`, validação de `unitIds` e consultas escopadas por clínica/unidade. A API, porém, protege `POST /patient/save` somente para `ADMIN`, enquanto a documentação do módulo declara que `ADMIN` e `BASIC` podem cadastrar pacientes. No frontend, `AddPatientModal` envia apenas `{ name }`, `PatientContext` chama `POST patients` com um payload legado incompatível e a tabela fixa código, data, status e paginação.

## Goals / Non-Goals

**Goals:**

- Fazer a listagem consumir um contrato paginado e renderizar fielmente seus dados.
- Centralizar o cadastro no endpoint que já valida a clínica e as unidades.
- Permitir que `BASIC` cadastre somente na unidade ativa e que `ADMIN` use unidades autorizadas da própria clínica.
- Entregar a referência visual com estados acessíveis e sem ações fictícias.
- Cobrir o contrato com testes de API e de integração do frontend.

**Non-Goals:**

- Criar uma nova política de tenant ou substituir a autorização server-side por filtros no navegador.
- Criar seletor de unidade para `BASIC`, edição, inativação ou detalhe clínico.
- Inferir “serviço principal” ou “Em atendimento” a partir de texto estático.
- Alterar a change ativa de associação de usuários; ela é uma dependência de sessão para `activeUnitId`.

## Decisions

### 1. Um único contrato de criação

O fluxo oficial será `POST /patient/save`. O request continuará aceitando `clinicId` apenas como compatibilidade não autoritativa, mas a clínica efetiva será sempre a do principal autenticado. `unitIds` será obrigatório e resolvido contra a mesma clínica.

Manter `POST patients` foi rejeitado porque não existe rota correspondente no controller atual e seu payload (`empresa`, `createdAt`, `status` e `uuid`) não representa o modelo persistido. Duplicar os fluxos também permitiria que a UI exibisse sucesso em uma operação que não usa o contrato real.

### 2. Regra de papel e unidade

O controller deverá autorizar `ADMIN` e `USER` (`BASIC` no contrato do frontend). O service continuará derivando `clinicId` da sessão. Para `USER`, o conjunto efetivo de unidades será a unidade persistida no usuário e qualquer `unitIds` recebido deverá coincidir com ela. Para `ADMIN`, todos os IDs deverão pertencer à clínica autenticada.

A alternativa de aceitar qualquer `unitIds` enviado pelo navegador foi rejeitada porque permitiria ampliação de escopo. A alternativa de permitir cadastro sem unidade foi rejeitada porque a tabela `PATIENT_UNIT` e a regra de negócio exigem vínculo operacional.

### 3. Contrato de resposta separado de apresentação

O endpoint de listagem deverá retornar os campos persistidos e necessários à tabela — identificador, código, nome, clínica/unidades, data de cadastro e status quando o domínio o suportar. Serviço principal será um campo derivado e opcional; quando não houver fonte confiável, a resposta deverá indicar ausência e a UI exibirá `—`.

O frontend não calculará status de atendimento nem preencherá código/data com constantes. A API continuará sendo a fonte de autorização e de verdade dos dados.

### 4. Filtros e paginação como contrato explícito

Nome, status e serviço só serão enviados como filtros quando o backend oferecer esses parâmetros com a mesma regra de escopo. A página usará os metadados de `PageResponseDTO`, em vez de `totalCount=10` e `pageIndex=0` fixos. Se um filtro não puder ser implementado sem um contrato confiável, ele não será apresentado como funcional.

### 5. Visual baseado em tokens e estados acessíveis

A composição existente da casca interna será preservada. A página de pacientes receberá uma área de cabeçalho, filtros e card de tabela com os tokens verdes já usados no produto, contraste suficiente, avatares gerados das iniciais e chips com texto. Carregamento, erro, vazio e foco serão tratados como estados de conteúdo, não apenas como mudanças de cor.

Manter a tabela mínima atual foi rejeitado porque não atende à hierarquia da referência nem comunica claramente escopo, status e ações. Usar cor sem rótulo foi rejeitado por acessibilidade e porque status sem texto não é verificável.

## Risks / Trade-offs

- [O endpoint atual não devolve código, data, status nem serviço principal] → ampliar o DTO/mapper com dados reais; onde a informação não existir, usar ausência explícita e não mock visual.
- [A conta de recepção é `USER` e pode continuar recebendo 403 se só o controller for alterado] → adicionar teste de integração autenticado como `USER`, além do teste de `ADMIN`, comprovando que a unidade fica limitada.
- [O frontend e a API podem ser implantados em versões diferentes] → publicar primeiro o contrato compatível da API, manter campos adicionais opcionais na leitura e só depois ativar a tela modernizada.
- [O catálogo de unidades pode não conter a `activeUnitId`] → bloquear o submit de `BASIC`, mostrar erro de sessão/escopo e não selecionar outra unidade silenciosamente.
- [O nome atualmente é validado globalmente e não por clínica] → preservar o comportamento nesta change e registrar eventual mudança de unicidade em uma change separada, para não misturar regra de dados com redesign.
- [Status “Em atendimento” depende de agendamento corrente, mas não é propriedade de `Patient`] → não fabricar o estado; definir no contrato uma origem derivada ou deixar o valor ausente até existir uma regra de domínio validada.

## Migration Plan

1. Confirmar e testar o contrato de resposta da listagem e a autorização de criação na API.
2. Implantar a API com aceitação de `ADMIN`/`USER`, validação de unidade e campos adicionais compatíveis.
3. Atualizar os tipos, consulta, formulário e tabela do frontend; remover o caminho `PatientContext`/`POST patients` da rota.
4. Executar testes de integração frontend/backend com `ADMIN`, `BASIC`, unidade estrangeira, payload incompleto e duplicidade.
5. Validar lint, build e OpenSpec antes de solicitar implementação/arquivamento.

Rollback: reverter a composição visual e o adaptador do frontend mantendo a validação de unidade no backend. Não remover vínculos `PATIENT_UNIT` nem desfazer migrações de dados; a associação é parte do isolamento do tenant.
