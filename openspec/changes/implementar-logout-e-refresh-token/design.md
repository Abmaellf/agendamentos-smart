# Design

## Context

O frontend já usa uma instância Axios com `withCredentials: true`, mas a base query do RTK Query apenas transforma erros em resultado e não tenta renovar a sessão. O menu de conta consulta o perfil e renderiza “Sair” sem handler. A rota raiz ainda decide usando `useCookies(['jwt'])`, embora o novo contrato mantenha os cookies inacessíveis ao JavaScript.

## Goals / Non-Goals

**Goals:**

- Centralizar a renovação de sessão para chamadas RTK Query e para o bootstrap da rota raiz.
- Garantir no máximo uma renovação concorrente e uma repetição por requisição original.
- Encerrar o estado autenticado local após logout ou falha definitiva de refresh.
- Manter tokens fora de armazenamento acessível ao JavaScript.

**Non-Goals:**

- Implementar armazenamento local de access/refresh token.
- Criar telas de gestão de sessões, MFA ou recuperação de senha.
- Transformar a SPA em fonte de autorização para tenant, papel ou unidade.

## Decisions

### Cliente de sessão compartilhado

Adicionar uma camada pequena, usada pela base query e pelo bootstrap, que execute requests com credenciais, faça `POST /auth/refresh` quando necessário e exponha um evento de sessão expirada. A base query recebe o erro inicial, tenta refresh uma vez e repete a chamada; a chamada de refresh não passa pelo próprio retry.

Alternativa descartada: configurar somente um interceptor Axios. Isso não cobre automaticamente a chamada direta de bootstrap já existente e dificulta devolver o resultado correto ao contrato `BaseQueryFn` do RTK Query.

### Refresh single-flight

O cliente manterá uma `Promise` de refresh em andamento. Requisições que encontrarem `401` aguardam a mesma promise; ao resolver, cada uma repete sua própria chamada uma única vez. Ao rejeitar, a promise é liberada e o evento de expiração é emitido apenas uma vez por ciclo.

Alternativa descartada: cada requisição fazer seu próprio refresh, pois isso cria corrida de rotação e pode invalidar tokens concorrentes.

### Logout explícito

O menu usará uma mutation para `POST /auth/logout`. Em sucesso ou falha, o fluxo limpará o cache RTK Query e navegará para `/sign-in`; a falha será tratada como sessão já encerrada para evitar deixar dados privados na interface. O feedback visual será emitido somente depois da limpeza local.

### Entrada inicial validada

`FirstScreen` deixará de ler `jwt` e chamará um endpoint autenticado por meio da camada de sessão. Se a resposta confirmar a sessão, seguirá para `/appointments`; se a tentativa de refresh também falhar, seguirá para `/sign-in`.

### Compatibilidade de testes

Os testes MSW deverão declarar handlers para `/auth/refresh` e `/auth/logout`, além dos cenários de `401`, retry único, refresh concorrente e limpeza de cache. Nenhum fixture ou log de teste conterá token real; os testes podem usar marcadores artificiais apenas no corpo controlado pela MSW quando o contrato ainda exigir compatibilidade.

## Risks / Trade-offs

- [Risco] Um evento global de sessão expirada pode ocorrer fora de um componente React. → Mitigar com um único listener na casca autenticada e deduplicação por ciclo de expiração.
- [Risco] O navegador pode manter dados renderizados após logout se somente a rota mudar. → Mitigar resetando o estado RTK Query antes da navegação.
- [Risco] Cookies `HttpOnly` não ficam disponíveis para a decisão síncrona da rota raiz. → Mitigar usando validação assíncrona da API e estado de carregamento explícito.
- [Risco] O contrato de login sem token no JSON exige backend e frontend coordenados. → Mitigar implantando o endpoint backend antes do frontend e cobrindo o contrato integrado; rollback deve recolocar as versões compatíveis em conjunto.

## Migration Plan

1. Disponibilizar no backend login com os dois cookies e os endpoints de refresh/logout.
2. Atualizar o frontend para chamar refresh/logout, validar a entrada inicial e ignorar qualquer token de resposta.
3. Executar testes unitários, MSW, build e lint do frontend, além dos testes de contrato/integrados do backend.
4. Confirmar manualmente login, expiração simulada, refresh, logout e acesso direto a `/appointments` após logout.
5. Se o rollout precisar ser revertido, reverter frontend e backend como par; a alteração de contrato do login não é compatível com versões mistas por tempo indeterminado.
