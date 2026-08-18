# Contextos compartilhados

## Objetivo do módulo

Compartilhar estado e operações entre componentes sem passagem manual de propriedades.

## Responsabilidades e funcionalidades existentes

- `PatientContext`: mantém a lista e as operações legadas de pacientes;
- `useGlobalContext`: esqueleto comentado de um contexto de autenticação, sem comportamento útil.

## Dependências internas e externas

- internas: `lib/axios`;
- externas: React, use-context-selector, Axios types e date-fns;
- módulos relacionados: páginas de agenda/pacientes, `WeekDate` e `App.tsx`.

## Pontos de entrada e fluxos de entrada

`App` monta `PatientProvider`. Páginas de pacientes selecionam propriedades com
`useContextSelector`. A lista entra por `GET patient/list`; uma criação
alternativa sai por `POST patients`.

## Arquivos críticos

- `PatientContext.tsx`: provider ativo e seu contrato local;
- `useGlobalContext.tsx`: módulo órfão de uma estratégia antiga de token.

## Regras próprias do módulo

- Contextos devem guardar apenas estado de interface realmente compartilhado, como unidade ativa ou data selecionada; dados remotos pertencem ao React Query.
- O contexto de sessão futuro poderá expor usuário, papel, `tenantId`, unidade ativa, confirmação de e-mail e necessidade de troca de senha, sem expor credenciais.
- Pacientes, profissionais, serviços e agendamentos não devem ser criados diretamente por um provider genérico.
- Trocar a unidade ativa deve trocar também o escopo das queries operacionais; pacientes e profissionais continuam compartilhados no mesmo `tenant`.
- Regras de conflito, capacidade, recorrência e transição de estado não pertencem ao contexto visual e devem ser implementadas no domínio/adaptador de API.

## Observações técnicas e débitos

- O contexto ainda mistura estado remoto, HTTP e mutação de pacientes.
- `CreatePatients` envia o export `uuid` do Zod como valor, não um UUID gerado.
- A criação usa endpoint distinto do modal compartilhado.
- O tipo `Patient` é local e exige campos que nem todos os consumidores usam.
- `useGlobalContext` e o hook relacionado devem ser concluídos ou removidos após decisão sobre autenticação.
