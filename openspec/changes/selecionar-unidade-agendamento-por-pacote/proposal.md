# Proposal

## Why

O agendamento por pacote precisa usar a mesma fronteira de unidade já aplicada
ao agendamento manual. Hoje o fluxo de pacote não oferece a unidade como
contexto explícito para o administrador e pode listar pacientes sem garantir
que pertençam à unidade escolhida, criando risco de seleção inválida e uma
experiência diferente da agenda manual.

## What Changes

- Exibir no fluxo de agendamento por pacote um campo de unidade com as unidades
  autorizadas da clínica para `ADMIN`.
- Para usuário não administrador (`BASIC`), usar a unidade associada à sessão
  (`activeUnitId`) como contexto fixo, sem permitir troca pelo formulário.
- Carregar e apresentar pacientes somente depois que a unidade efetiva estiver
  definida, consultando o catálogo filtrado por essa unidade.
- Limpar a seleção de paciente e invalidar a prévia quando o administrador
  trocar a unidade, evitando reutilizar um paciente da unidade anterior.
- Enviar a unidade efetiva na prévia e na confirmação do agendamento por pacote;
  o servidor deverá validar novamente clínica, unidade, paciente e pacote no
  escopo autenticado. **BREAKING**: o payload de pacote passa a exigir o
  contexto de unidade quando ele ainda não estiver implícito no contrato.
- Manter a seleção de pacote compatível com a mesma unidade efetiva e preservar
  o comportamento de agendamento manual fora deste fluxo.

Fora de escopo: permitir que `BASIC` escolha outra unidade, criar ou editar
unidades, alterar a associação do usuário, mudar regras de disponibilidade,
duplicar a autorização no frontend ou alterar a gestão administrativa de
pacotes.

## Capabilities

### New Capabilities

- `package-appointment-unit-scoping`: define a unidade efetiva do agendamento
  por pacote e o escopo de pacientes e pacotes usados na contratação.

### Modified Capabilities

Nenhuma.

## Impact

- Frontend: diálogo de agendamento por pacote, estado do formulário, consultas
  RTK Query de unidades/pacientes/pacotes, limpeza de seleções dependentes e
  testes de integração do fluxo.
- Contrato HTTP: prévia e confirmação precisarão transportar ou resolver
  `unitId`; consultas de pacientes e pacotes devem aceitar o filtro de unidade
  conforme os contratos da API irmã.
- Segurança e dados: `ADMIN` poderá operar em qualquer unidade da própria
  clínica; `BASIC` ficará limitado à unidade associada ao usuário. A API é a
  autoridade para tenant, permissões e integridade.
- Dependências: reutiliza `user-clinic-unit-assignment` e as regras de escopo
  de `weekly-appointments`; depende da entrega da capability de contratação
  `package-appointment-contracts` em andamento.
