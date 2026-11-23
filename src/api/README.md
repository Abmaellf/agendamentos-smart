# Integrações de API

## Objetivo do módulo

Encapsular operações HTTP e utilitários de autenticação usados pelo frontend.

## Responsabilidades e funcionalidades existentes

- login por `POST /auth/login`;
- perfil por `GET auth/me`;
- operações de pacientes foram movidas para `features/patients/api`;
- função desconectada de cadastro de usuário por `POST /auth/register/:id`;
- renovação e encerramento da sessão por cookies `HttpOnly` em `session.ts`;
- redirecionamento inicial validado pela API em `firstScreen/`, embora esse componente não seja uma API.

## Dependências internas e externas

- internas: `lib/axios`, `lib/session-client` e `lib/base-api`;
- externas: Axios indiretamente, React/Router no componente `firstScreen`;
- módulos relacionados: autenticação, Header, pacientes, contexto e `env.ts`.

## Pontos de entrada e fluxos de entrada

| Export               | Consumidor ativo              | Fluxo                          |
| -------------------- | ----------------------------- | ------------------------------ |
| `signIn`             | `page/auth/sign-in.tsx`       | formulário → mutation → cookies HttpOnly → API |
| `getProfile`         | `components/account-menu.tsx` | Header → query → API           |
| `sessionApi.logout`  | `components/account-menu.tsx` | menu “Sair” → `POST /auth/logout` |
| `registerUser`       | nenhum                        | órfão                          |

## Arquivos críticos

- `sign-in.ts`, `get-profile.ts`: contratos atualmente executados nesta camada;
- `features/patients/api/patients.ts`: listagem paginada e cadastro de pacientes via RTK Query;
- `session.ts`: encerramento explícito da sessão sem receber tokens no JavaScript;
- `register-user.ts`: intenção de cadastro ainda não ligada à tela;
- `firstScreen/first-screen.tsx`: decisão de navegação inicial.

## Regras próprias do módulo

- A API real está em outro repositório; durante o MVP, um adaptador de mock deve implementar os mesmos DTOs esperados, sem acesso direto de páginas a `data.json`.
- Toda operação de dados da clínica deve ser escopada por `tenantId`; agendamentos também usam `unitId`.
- A camada deve cobrir sessão, validação de e-mail, troca obrigatória de senha, usuários, pacientes, profissionais, serviços e agendamentos.
- Autorizações precisam ser aplicadas no mock e confirmadas novamente pelo backend real: usuário básico não cancela, não cria/promove administrador e não altera preço/duração padrão no agendamento.
- Agendamento deve validar sobreposição de paciente/profissional e capacidade do serviço, sem opção de ignorar conflito.
- Remarcação e cancelamento são comandos auditáveis; não deve existir endpoint de exclusão definitiva de agendamento.
- Respostas e logs não podem expor senha, token, CPF ou outros dados pessoais desnecessários.
- Erros devem possuir formato comum para autenticação, autorização, validação, conflito, capacidade e indisponibilidade.

## Observações técnicas e débitos

- Logs de autenticação não devem registrar tokens, usuário, perfil ou respostas sensíveis.
- `GetProfileResponse` inclui `password`, ampliando exposição de dado sensível.
- Endpoints alternam barra inicial, singular e plural.
- `lib/session-client.ts` coordena refresh single-flight, retry único e expiração global de sessão.
- A função `registerUser` busca perfil antes do cadastro e usa o `id` superior da resposta; o contrato de backend não está documentado para confirmar se esse é o identificador esperado.
- O componente de redirecionamento deve migrar para a camada de roteamento/autenticação.
