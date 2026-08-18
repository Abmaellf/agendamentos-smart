# Redirecionamento inicial

## Objetivo do módulo

Decidir a primeira rota do usuário com base na presença do cookie `jwt`.

## Responsabilidades e funcionalidades existentes

`FirstScreen` apresenta um ícone de carregamento, espera `1000 ms` e navega para `/sign-in` sem cookie ou `/appointments` com cookie.

## Dependências internas e externas

- externas: React, React Router, react-cookie e Lucide;
- internas: nenhuma chamada de API;
- módulos relacionados: `Router.tsx`, `page/auth` e `_layout/app`.

## Ponto de entrada e fluxo de entrada

É montado exclusivamente pela rota `/`. Entrada: cookie `jwt`; saída: navegação para login ou agenda.

## Arquivo crítico

- `first-screen.tsx`: contém toda a regra deste módulo.

## Regras próprias do módulo

- A decisão inicial deve usar uma sessão validada, não apenas a presença de um cookie.
- Sem sessão válida, o destino é o login; com e-mail pendente, o destino é a confirmação; com senha temporária, o destino é a troca obrigatória.
- Somente uma sessão apta e associada a `tenantId` e unidade padrão pode seguir para a agenda.
- O redirecionamento não deve depender de espera artificial nem substituir a guarda das rotas internas.

## Observações técnicas e débitos

- A pasta está sob `api`, embora o componente pertença à autenticação/roteamento.
- Presença de cookie não comprova validade ou expiração.
- A proteção não se aplica a acessos diretos às rotas internas.
- O comentário menciona `100 ms`, mas o temporizador usa `1000 ms`.
