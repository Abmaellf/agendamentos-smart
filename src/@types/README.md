# Tipos compartilhados

## Objetivo do módulo

Centralizar contratos TypeScript compartilhados sem transformar a pasta em um
depósito de tipos internos de implementação.

## Responsabilidades e funcionalidades existentes

- `appointment.ts` concentra os contratos de domínio e transporte da agenda;
- `components.ts` concentra propriedades, estado e valores de formulário usados
  pela camada de componentes;
- `patient.ts` concentra o contrato do contexto legado de pacientes;
- `ui.ts` concentra as propriedades nomeadas dos componentes-base;
- `UserTypes.ts` mantém uma resposta de login legada, ainda sem consumidor ativo.

## Dependências internas e externas

- `appointment.ts` não possui dependências;
- `components.ts` depende apenas de tipos de React, Router e `appointment.ts`;
- `patient.ts` depende apenas de tipos de React e Axios;
- `ui.ts` deriva as variantes diretamente dos componentes-base;
- módulos relacionados: componentes, agenda, pacientes e autenticação.

## Pontos de entrada e fluxos de entrada

Os arquivos desta pasta são importados explicitamente com o alias `@/@types`.
Não há declarações globais implícitas.

## Arquivos críticos

- `appointment.ts`: contrato canônico da agenda;
- `components.ts`: contratos próprios da camada visual;
- `ui.ts`: contratos derivados dos primitivos de interface;
- `patient.ts`: contrato temporário do contexto legado;
- `UserTypes.ts`: órfão.

## Regras próprias do módulo

- Devem existir tipos canônicos para `Tenant`, `Unit`, `User`, `Patient`, `Professional`, `Service`, `Appointment`, `AppointmentSeries` e `AppointmentEvent`.
- Entidades da clínica carregam `tenantId`; entidades operacionais por unidade também carregam `unitId`.
- Papéis devem ser união/enum fechado com `ADMIN` e `BASIC`; o usuário master da plataforma não deve ser confundido com um papel da clínica.
- Estados canônicos do agendamento são `AGENDADO`, `CONFIRMADO`, `EM_ATENDIMENTO`, `CONCLUIDO`, `CANCELADO`, `FALTA` e `REMARCADO`.
- Respostas de perfil e demais DTOs nunca devem expor senha. Senha inicial e troca obrigatória pertencem somente aos contratos de comando apropriados.
- Preço, data/hora e duração precisam de representações inequívocas; datas trocadas com a API devem carregar fuso/offset.
- Props e contratos compartilhados devem ser exportados desta pasta e importados
  com `import type`;
- tipos triviais usados uma única vez, como `React.ComponentProps<'div'>`, podem
  permanecer inline no componente;
- tipos inferidos de schemas de validação devem continuar vinculados ao schema ou
  possuir uma anotação que impeça divergência entre o contrato e a validação.

## Observações técnicas e débitos

- Perfil e paciente ainda possuem contratos legados ou locais que precisam ser
  consolidados quando os respectivos fluxos forem modernizados.
- O tipo de usuário inclui `password`; respostas de frontend não devem modelar senha quando ela não é necessária.
