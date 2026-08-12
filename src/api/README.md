# Integrações de API

## Objetivo do módulo

Encapsular operações HTTP e utilitários de autenticação usados pelo frontend.

## Responsabilidades e funcionalidades existentes

- login por `POST /auth/login`;
- perfil por `GET auth/me`;
- criação de paciente por `POST /patient/save`;
- função desconectada de cadastro de usuário por `POST /auth/register/:id`;
- utilitários desconectados de token em `localStorage`;
- redirecionamento inicial por cookie em `firstScreen/`, embora esse componente não seja uma API.

## Dependências internas e externas

- internas: `lib/axios`, `constants/authorizationConstants` e `storageProxy`;
- externas: Axios indiretamente, React/Router/Cookies no componente `firstScreen`;
- módulos relacionados: autenticação, Header, pacientes, contexto e `env.ts`.

## Pontos de entrada e fluxos de entrada

| Export               | Consumidor ativo                 | Fluxo                          |
| -------------------- | -------------------------------- | ------------------------------ |
| `signIn`             | `page/auth/sign-in.tsx`          | formulário → mutation → API    |
| `getProfile`         | `components/account-menu.tsx`    | Header → query → API           |
| `RegisterPatient`    | `components/AddPatientModal.tsx` | modal → mutation → API         |
| `registerUser`       | nenhum                           | órfão                          |
| funções de `auth.ts` | nenhum                           | cadeia órfã com `storageProxy` |

## Arquivos críticos

- `sign-in.ts`, `get-profile.ts`, `register-patient.ts`: contratos atualmente executados;
- `auth.ts`, `storageProxy.ts`: estratégia alternativa de token não conectada;
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

- Há logs de token, usuário, perfil e respostas; devem ser removidos.
- `GetProfileResponse` inclui `password`, ampliando exposição de dado sensível.
- Endpoints alternam barra inicial, singular e plural.
- Não há interceptores, tipos de erro, cancelamento ou tratamento comum de `401`.
- A função `registerUser` busca perfil antes do cadastro e usa o `id` superior da resposta; o contrato de backend não está documentado para confirmar se esse é o identificador esperado.
- O componente de redirecionamento deve migrar para a camada de roteamento/autenticação.
