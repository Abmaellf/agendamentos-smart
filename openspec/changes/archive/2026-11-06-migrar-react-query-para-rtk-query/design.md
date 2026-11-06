# Design

## Context

Consulte [proposal.md](proposal.md) para a motivação. O checkout atual concentra as chamadas HTTP na instância Axios `src/lib/axios.ts`, configurada com `VITE_API_URL` e `withCredentials: true`. TanStack Query aparece em dez operações remotas, em um provider global e no helper de renderização de testes.

Os contratos da API são externos e não fazem parte desta change. Em particular, a agenda em produção chama `/api/appointments`; os handlers MSW ainda usam o caminho singular e já são uma divergência conhecida da linha de base.

## Goals / Non-Goals

**Goals:**

- Centralizar cache, ciclo de requisição e invalidação de dados remotos no RTK Query.
- Conservar os DTOs, transformações (`contentOf` e `parseSessionProfile`), parâmetros, cookies e mensagens visíveis já existentes.
- Fazer a criação de agendamento refazer todas as consultas de agenda em cache, como a invalidação atual da chave-raiz `appointments`.
- Garantir que cada teste tenha store e cache isolados.

**Non-Goals:**

- Alterar endpoints, contratos de backend, autenticação, autorização, `tenantId`, rotas ou regras de agendamento.
- Corrigir fluxos legados não relacionados, como o `PatientContext`, logs existentes ou a modelagem de perfil.
- Adicionar estado de interface ao Redux, persistência, optimistic update, polling ou uma nova política de retry.
- Materializar uma tag de capacidade de serviço: não há consulta RTK Query correspondente para a chave `service-capacity` invalidada hoje.

## Decisions

### Uma única `baseApi` e endpoints injetados por domínio

Será criado um `createApi` central que possua reducer, middleware e a lista explícita de `tagTypes`. Os módulos de sessão, agenda e APIs legadas injetarão endpoints nesse cliente e exportarão apenas os hooks gerados que seus consumidores usam.

Isso evita múltiplos caches para a mesma origem e mantém endpoints próximos de seus tipos e regras de transformação. Uma API por domínio foi considerada, mas descartada porque cada `createApi` adicionaria middleware, cache e configuração próprios sem necessidade nesta SPA.

### Adaptador `axiosBaseQuery` reutiliza a instância atual

O `baseQuery` será um adaptador tipado sobre `api.request`, e não `fetchBaseQuery`. Ele retornará `data` em sucesso e `{ status, data }` em falha, sem engolir o corpo de erro.

Assim `baseURL`, `withCredentials` e qualquer evolução futura da instância Axios continuam em um único lugar. `fetchBaseQuery` foi descartado porque duplicaria essa configuração e alteraria o formato de erro que os consumidores precisam tratar.

### Cache de agenda por parâmetros, invalidado por uma tag de lista

`getAppointments({ unitId, from, to })` será um endpoint de consulta cujo argumento é a chave de cache. Cada resposta fornecerá a tag `Appointment/LIST`; a mutação de criação invalidará a mesma tag. Essa escolha refaz todas as semanas mantidas em cache, equivalente à atual invalidação de `['appointments']` por prefixo.

Os catálogos, sessão e perfil receberão tags próprias quando uma mutação existente ou futura puder invalidá-los. O endpoint de cadastro legado de paciente não ganhará uma invalidação especulativa, pois ele não atualiza hoje nenhuma consulta compatível.

### Estados condicionais e falhas mantêm a semântica da interface

O diálogo de agendamento usará opções `skip` para não solicitar catálogos fechado e para não consultar profissionais sem `serviceId`. A página só consultará a agenda após a sessão estar disponível. Retentativas continuarão chamando `refetch`; mutações chamarão `trigger(args).unwrap()` para que os blocos `catch` permaneçam responsáveis pelo feedback.

O normalizador de erro de agendamento será ajustado para aceitar o erro padronizado pelo `axiosBaseQuery`, preservando as mensagens por código de domínio. Manter `axios.isAxiosError` como única condição foi descartado porque `unwrap()` recebe o erro serializável retornado pelo RTK Query.

### Store isolada em cada teste

`renderWithProviders` criará uma store por renderização, registrará reducer e middleware da `baseApi` e a exporá opcionalmente ao teste. O cleanup resetará o estado da API entre casos, enquanto o MSW continuará controlando respostas.

Reutilizar a store global de produção foi descartado para evitar vazamento de cache entre testes. A correção dos handlers para `/api/appointments` entra neste mesmo trabalho porque o RTK Query deve ser validado contra as URLs que o código de produção efetivamente chama.

## Risks / Trade-offs

- [Migração alterar mensagens de erro de domínio] → cobrir conflito, recurso inexistente e falha de rede nos testes do diálogo antes de remover TanStack Query.
- [Cache condicional buscar dados quando o diálogo estiver fechado] → testar ausência de requests antes da abertura e busca de profissionais apenas após a seleção do serviço.
- [A tag `Appointment/LIST` atualizar mais semanas que a visível] → manter esse comportamento deliberadamente equivalente à invalidação por prefixo existente; especializar tags somente em uma change de desempenho.
- [Endpoint ou handler legado usar plural/singular divergente] → preservar o código de produção e alinhar os handlers MSW ao caminho atualmente executado, sem alterar o backend.
- [Caches cruzarem casos de teste] → instanciar store por renderização e executar `resetApiState` no cleanup.

## Migration Plan

1. Instalar as dependências, criar a store, o adapter Axios e a `baseApi`, e trocar o provider raiz.
2. Declarar endpoints tipados, preservando as transformações e os contratos atuais.
3. Migrar cada consumidor para hooks gerados, começando pela agenda e seu diálogo, depois pelos módulos legados.
4. Adaptar helper de testes e handlers MSW; executar os testes de agenda e dos componentes migrados.
5. Remover `QueryClient`, `QueryClientProvider`, o hook `useAppointments`, o arquivo `src/lib/react-query.ts` e a dependência TanStack somente quando a busca não encontrar referências de produção ou teste.

Rollback: antes da remoção, a migração pode ser revertida em um único commit. Após a remoção, o rollback restaura a dependência, o provider e os consumidores TanStack deste mesmo commit; não há migração de dados persistidos.
