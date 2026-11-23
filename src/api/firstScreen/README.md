# Redirecionamento inicial

## Objetivo do módulo

Decidir a primeira rota do usuário validando a sessão HttpOnly pela API.

## Responsabilidades e funcionalidades existentes

`FirstScreen` apresenta um ícone de carregamento, chama `GET /auth/me` pela camada de sessão e navega para `/sign-in` quando a sessão não pode ser renovada ou para `/appointments` quando é válida.

## Dependências internas e externas

- externas: React, React Router e Lucide;
- internas: `lib/session-client`;
- módulos relacionados: `Router.tsx`, `page/auth` e `_layout/app`.

## Ponto de entrada e fluxo de entrada

É montado exclusivamente pela rota `/`. Entrada: sessão enviada automaticamente pelo navegador; saída: navegação para login ou agenda.

## Arquivo crítico

- `first-screen.tsx`: contém toda a regra deste módulo.

## Regras próprias do módulo

- A decisão inicial deve usar uma sessão validada, não apenas a presença de um cookie.
- Sem sessão válida, o destino é o login; com e-mail pendente, o destino é a confirmação; com senha temporária, o destino é a troca obrigatória.
- Somente uma sessão apta e associada a `tenantId` e unidade padrão pode seguir para a agenda.
- O redirecionamento não deve depender de espera artificial nem substituir a guarda das rotas internas.

## Observações técnicas e débitos

- A pasta está sob `api`, embora o componente pertença à autenticação/roteamento.
- A validação usa o endpoint autenticado e o refresh coordenado; a presença do cookie não é lida pelo JavaScript.
- A proteção não se aplica a acessos diretos às rotas internas.
- Não há espera artificial no bootstrap; o carregamento termina após a validação da sessão.
