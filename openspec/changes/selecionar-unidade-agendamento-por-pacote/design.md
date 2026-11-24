# Design

## Context

O diálogo atual de agendamento por pacote consulta o catálogo geral de
pacientes, dispara o catálogo de unidades sem usá-lo no formulário e filtra
pacotes apenas no cliente para `BASIC`. O agendamento manual já possui o
contrato de pacientes por `unitId` e a sessão fornece `activeUnitId`.

A contratação por pacote está sendo introduzida por uma change paralela. Esta
change adiciona o contexto de unidade ao fluxo e deve ser implementada junto
com o contrato de prévia/confirmação dessa capability, sem transformar o
frontend em autoridade de autorização.

## Goals / Non-Goals

**Goals:**

- Reutilizar o mesmo conceito de unidade efetiva do agendamento manual.
- Fazer com que paciente, pacote, prévia e confirmação usem a mesma unidade.
- Evitar estado obsoleto ao trocar a unidade e produzir testes de isolamento
  para `ADMIN` e `BASIC`.
- Manter a autorização definitiva e a validação de compatibilidade no servidor.

**Non-Goals:**

- Criar um seletor global ou permitir troca de unidade por `BASIC`.
- Alterar o vínculo persistente do usuário, o cadastro de unidades ou a gestão
  administrativa de pacotes.
- Definir feriados, horários de funcionamento, bloqueios ou regras de conflito.

## Decisions

### Derivar uma única unidade efetiva para todo o diálogo

O formulário terá um `effectiveUnitId`: para `ADMIN`, ele será preenchido pela
seleção de uma unidade do catálogo autorizado; para `BASIC`, será derivado de
`session.activeUnitId` e ficará bloqueado. A lista exibida ainda deverá ser
validada contra o catálogo retornado, permitindo um estado explícito de unidade
indisponível.

Alternativa rejeitada: manter `unitId` apenas no pacote selecionado. Isso deixa
o paciente sem escopo antes da escolha do pacote e permite que a interface
misture catálogos de unidades diferentes.

### Usar consultas dependentes e limpar descendentes

O catálogo de pacientes será consultado com `unitId=effectiveUnitId` somente
quando a unidade existir. O catálogo de pacotes será solicitado com o mesmo
filtro de unidade (além de `active=true`), aproveitando a capacidade de filtros
já existente no adaptador de pacotes. Ao mudar a unidade, o fluxo limpará
paciente, pacote, dias efetivos e prévia antes de aceitar novas escolhas.

Alternativa rejeitada: carregar todos os pacientes/pacotes e filtrar somente no
render. Além de expor dados fora do contexto, essa abordagem diverge do
endpoint já usado pelo agendamento manual e não protege a confirmação.

### Enviar `unitId` e revalidar no servidor

O input de prévia e confirmação incluirá `unitId`. O backend continuará
derivando `tenantId` da autenticação, verificará que a unidade pertence à
clínica, que `BASIC` usa sua unidade associada e que paciente/pacote pertencem
à mesma unidade. A resposta da prévia continuará identificando a unidade
resolvida para tornar o contexto auditável.

Alternativa rejeitada: confiar somente na unidade exibida ou no filtro de
frontend, pois o cliente não é fonte de autorização e a requisição pode ser
alterada fora da interface.

### Tratar unidade como dependência da ação, não como valor implícito tardio

Sem unidade efetiva, o diálogo não permitirá selecionar paciente, gerar prévia
ou confirmar. Sem pacientes na unidade, exibirá estado vazio e bloqueará a
ação. Esse comportamento evita chamadas inválidas e torna as falhas de catálogo
visíveis sem inventar uma unidade padrão para o administrador.

## Risks / Trade-offs

- [A API de pacotes pode ainda não aceitar `unitId` no filtro] → alinhar o
  endpoint da API irmã antes da implementação e cobrir a query nos testes de
  contrato; não filtrar silenciosamente somente no cliente.
- [A sessão BASIC pode referenciar uma unidade removida ou ausente no catálogo]
  → bloquear o fluxo com mensagem acionável e não substituir a unidade por
  outra automaticamente.
- [Uma troca de unidade pode deixar respostas assíncronas antigas em voo] → a
  chave da consulta deve incluir `unitId` e a seleção dependente deve ser
  invalidada/limpa antes de aceitar a nova resposta.
- [A unidade pode mudar entre prévia e confirmação] → o servidor deve
  revalidar unidade, paciente e pacote na confirmação e rejeitar o fingerprint
  ou contexto incompatível sem persistência parcial.

## Migration Plan

1. Alinhar o contrato da API de prévia/confirmação e dos catálogos para aceitar
   o contexto `unitId`.
2. Atualizar os tipos e adaptadores do frontend e o estado dependente do
   diálogo.
3. Adicionar testes de unidade/integração para seleção por papel, filtro de
   pacientes, troca de unidade, pacote incompatível e confirmação segura.
4. Publicar a alteração junto da capability de contratação por pacote; não há
   migração destrutiva de dados, pois agendamentos manuais existentes permanecem
   inalterados.

