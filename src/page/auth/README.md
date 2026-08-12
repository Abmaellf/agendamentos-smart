# Autenticação e cadastro visual

## Objetivo do módulo

Oferecer telas públicas de login e intenção de cadastro de usuário/clínica.

## Responsabilidades e funcionalidades existentes

- `SignIn`: coleta login/senha, chama autenticação, notifica resultado e navega para a agenda;
- `SignUp`: coleta três campos visuais e navega para a agenda sem enviar dados.

## Dependências internas e externas

- internas: `api/sign-in`, `components/ui` e `globals.css`;
- externas: React Router, React Query, React Hook Form, Zod, Helmet, Sonner, Radix Label e Lucide;
- módulos relacionados: `AuthLayout`, `FirstScreen` e `api/register-user.ts`.

## Pontos de entrada e fluxos de entrada

- `/sign-in` → `POST /auth/login` → sucesso: `/agendamento`; falha: toast;
- `/sign-up` → clique em link/botão → `/agendamento`, sem mutation.

## Arquivos críticos

- `sign-in.tsx`: fluxo real de autenticação;
- `sign-up.tsx`: fluxo apenas visual.

## Regras próprias do módulo

### Cadastro inicial

- Pessoa física ou jurídica informa nome da clínica/profissional, CPF ou CNPJ, e-mail e senha.
- O cadastro cria a clínica (`tenant`), a unidade padrão e o usuário `ADMIN`.
- A conta não acessa a área interna antes da validação do e-mail.
- CPF suporta somente uma unidade; CNPJ terá múltiplas unidades em etapa futura, criadas pelo usuário master da plataforma.

### Login e senha

- Login deve produzir sessão associada a usuário, papel, `tenantId` e unidade padrão.
- Administrador define a senha inicial dos usuários criados; ela é temporária e deve ser trocada no primeiro acesso.
- O MVP não possui recuperação de senha por e-mail. Somente administrador pode redefinir a senha de outro usuário.
- Perfil básico pode criar apenas outro usuário básico; somente administrador cria ou promove administrador.
- Senha, token e dados pessoais não podem aparecer em URL, log ou resposta de perfil.

## Observações técnicas e débitos

- O schema de login exige somente strings, sem mínimo ou validação de e-mail do Zod.
- O login imprime token e usuário no console.
- O cliente não armazena o token; depende de comportamento do backend/cookie não comprovado aqui.
- `SignUp` não usa React Hook Form, não chama `registerUser` e não persiste clínica.
- `redirect()` retornado pelo `onClick` não controla a navegação; o `Link` é quem navega.
- O texto “Acompanhe suas vendas” não corresponde aos fluxos de agenda presentes.
