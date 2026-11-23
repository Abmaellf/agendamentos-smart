# Proposal

## Why

O menu interno já apresenta a ação “Sair”, mas ela não encerra a sessão nem impede que a interface continue exibindo dados autenticados. Além disso, a sessão atual depende da presença de `jwt` e não possui renovação coordenada quando o acesso expira, o que causa falhas após o vencimento do JWT.

## What Changes

- Integrar a ação “Sair” do menu de conta a `POST /auth/logout`.
- Adicionar a integração do frontend a `POST /auth/refresh`, usando os cookies `HttpOnly` gerenciados pela API e sem armazenar tokens em `localStorage` ou `sessionStorage`.
- Fazer a camada HTTP tentar uma renovação uma única vez após `401`, repetir a requisição original somente quando a renovação for bem-sucedida e evitar refresh concorrente para várias requisições expiradas.
- Limpar o cache RTK Query, fechar o menu e navegar para `/sign-in` após logout explícito ou quando a renovação falhar.
- Alterar a entrada inicial para validar a sessão por chamada autenticada, em vez de tratar a presença de um cookie como prova suficiente de sessão válida.
- Atualizar testes e documentação do módulo de autenticação para cobrir logout, refresh, expiração e ausência de vazamento de tokens.

## Capabilities

### New Capabilities

- Nenhuma. O fluxo pertence às capacidades de sessão e casca de aplicação já existentes.

### Modified Capabilities

- `access-session-baseline`: ampliar a sessão existente com validação, refresh automático, logout e tratamento de sessão expirada.
- `application-shell-baseline`: tornar a opção “Sair” do menu de conta uma ação funcional e observável.

## Impact

- Frontend: `src/lib/axios*`, integração RTK Query, `FirstScreen`, menu de conta, navegação e testes de autenticação/casca.
- Contratos HTTP consumidos: novos `POST /auth/refresh` e `POST /auth/logout`; o frontend dependerá de cookies de sessão enviados com credenciais.
- Rotas: `/sign-in` passa a ser o destino após logout e após falha definitiva de renovação; nenhuma rota nova é criada.
- Segurança: nenhum refresh token será lido ou persistido pelo JavaScript; a autorização continuará sendo responsabilidade da API.
- Fora de escopo: recuperação de senha, MFA, listagem de dispositivos/sessões, logout global de todos os dispositivos e mudanças nas permissões de `ADMIN`/`BASIC`.
