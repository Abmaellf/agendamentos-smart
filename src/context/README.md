# Contextos compartilhados

## Objetivo do módulo

Compartilhar estado e operações entre componentes sem passagem manual de propriedades.

## Responsabilidades e funcionalidades existentes

- `PatientContext`: foi movido para `features/patients/model` e permanece
  documentado na própria feature durante a migração;
- `useGlobalContext`: esqueleto comentado de um contexto de autenticação, sem comportamento útil.

## Dependências internas e externas

- internas: `lib/axios`;
- externas: React, use-context-selector, Axios types e date-fns;
- módulos relacionados: páginas de agenda/pacientes, `WeekDate` e `App.tsx`.

## Pontos de entrada e fluxos de entrada

`App` monta o `PatientProvider` pertencente à feature de pacientes. O diretório
`src/context` não deve receber novos contextos de domínio.

## Arquivos críticos

- `features/patients/model/patient-context.tsx`: provider ativo e seu contrato;
- `useGlobalContext.tsx`: módulo órfão de uma estratégia antiga de token.

## Regras próprias do módulo

- Contextos devem guardar apenas estado de interface realmente compartilhado, como unidade ativa ou data selecionada; dados remotos pertencem ao React Query.
- O contexto de sessão futuro poderá expor usuário, papel, `tenantId`, unidade ativa, confirmação de e-mail e necessidade de troca de senha, sem expor credenciais.
- Pacientes, profissionais, serviços e agendamentos não devem ser criados diretamente por um provider genérico.
- Trocar a unidade ativa deve trocar também o escopo das queries operacionais; pacientes e profissionais continuam compartilhados no mesmo `tenant`.
- Regras de conflito, capacidade, recorrência e transição de estado não pertencem ao contexto visual e devem ser implementadas no domínio/adaptador de API.

## Observações técnicas e débitos

- O contexto da feature ainda mistura estado remoto, HTTP e mutação de
  pacientes; isso é débito funcional preservado desta refatoração.
- `CreatePatients` envia o export `uuid` do Zod como valor, não um UUID gerado.
- A criação usa endpoint distinto do modal compartilhado.
- O tipo `Patient` é local e exige campos que nem todos os consumidores usam.
- `useGlobalContext` e o hook relacionado devem ser concluídos ou removidos após decisão sobre autenticação.
