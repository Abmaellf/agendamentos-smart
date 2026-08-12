# Tipos globais

## Objetivo do módulo

Fornecer declarações TypeScript compartilhadas ou extensões de tipos de bibliotecas.

## Responsabilidades e funcionalidades existentes

- `styled.d.ts` estende `DefaultTheme` com a forma de `defaultTheme`;
- `UserTypes.ts` declara uma resposta de login que não é usada por código ativo.

## Dependências internas e externas

- `styled.d.ts` depende de `styles/themes/default` e styled-components;
- `UserTypes.ts` não possui dependência;
- módulos relacionados: estilos e autenticação.

## Pontos de entrada e fluxos de entrada

`styled.d.ts` é incluído automaticamente pelo TypeScript. `UserType` aparece apenas em comentário dentro de `hooks/useRequest.ts`.

## Arquivos críticos

- `styled.d.ts`: necessário aos componentes styled-components tipados;
- `UserTypes.ts`: órfão.

## Regras próprias do módulo

- Devem existir tipos canônicos para `Tenant`, `Unit`, `User`, `Patient`, `Professional`, `Service`, `Appointment`, `AppointmentSeries` e `AppointmentEvent`.
- Entidades da clínica carregam `tenantId`; entidades operacionais por unidade também carregam `unitId`.
- Papéis devem ser união/enum fechado com `ADMIN` e `BASIC`; o usuário master da plataforma não deve ser confundido com um papel da clínica.
- Estados canônicos do agendamento são `AGENDADO`, `CONFIRMADO`, `EM_ATENDIMENTO`, `CONCLUIDO`, `CANCELADO`, `FALTA` e `REMARCADO`.
- Respostas de perfil e demais DTOs nunca devem expor senha. Senha inicial e troca obrigatória pertencem somente aos contratos de comando apropriados.
- Preço, data/hora e duração precisam de representações inequívocas; datas trocadas com a API devem carregar fuso/offset.

## Observações técnicas e débitos

- Entidades de negócio são redefinidas localmente; falta um contrato canônico para perfil, paciente e agendamento.
- O tipo de usuário inclui `password`; respostas de frontend não devem modelar senha quando ela não é necessária.
