# Design

## Context

Consulte `proposal.md` para a motivação e `specs/feature-ui-reuse-audit/spec.md` para os critérios normativos. A linha de base atual separa parcialmente `appointments`, `patients` e `session`, enquanto `src/components/` reúne o layout interno, primitives de interface e componentes legados da agenda.

A inspeção estrutural e de código encontrou estes candidatos iniciais:

| Candidato | Evidência atual | Decisão inicial | Risco principal |
| --- | --- | --- | --- |
| Criação de paciente | `features/patients/components/create-patient-dialog.tsx` usa contexto e `POST patients`; `add-patient-modal.tsx` usa RTK Query e `POST /patient/save` | Adiar por contrato; comparar apresentação somente após decidir o fluxo funcional | Alterar endpoint, cache ou estado da lista sem autorização da change |
| Paginação | `features/patients/components/pagination.tsx` tem resumo e quatro controles; `components/ui/pagination.tsx` é uma primitive genérica sem consumidor ativo confirmado | Manter contratos separados até validar comportamento e consumidores | Ocultar lacunas funcionais ou mudar acessibilidade/API pública |
| Campo com rótulo e erro | `Field` local em `create-appointment-dialog.tsx`; formulários de pacientes e autenticação fazem composição própria | Candidato de baixa confiança; extrair somente com segundo uso compatível | Criar abstração acoplada ao formulário de agendamento |
| Cartões/calendário legados | `components/Card`, `CardDay`, `CardPatient` e `WeekDate` aparecem sem consumidor ativo confirmado no inventário/documentação | Legado/órfão; não promover nem remover nesta change | Confundir código histórico com contrato atual |
| Primitives de UI | `button`, `dialog`, `input`, `label`, `table`, `calendar` e similares já estão em `components/ui` | Reutilizar; não criar wrappers duplicados sem comportamento adicional comprovado | Aumentar a camada compartilhada sem ganho de contrato |

Essa tabela é uma hipótese inicial baseada na inspeção do checkout. A decisão final depende da confirmação de callers, testes e contratos durante a execução da auditoria.

## Registro da auditoria

| Candidato | Finalidade e contrato observado | Consumidores/evidência | Classificação e próximo passo |
| --- | --- | --- | --- |
| `Field` do diálogo de agendamento + campo de nome do modal de pacientes | Associar rótulo a um controle, garantir `id`, conectar `aria-describedby` ao erro e exibir mensagem; não acessa API nem conhece domínio | `create-appointment-dialog.tsx` usa o padrão em oito campos; `add-patient-modal.tsx` repete rótulo, controle e erro; testes em `create-appointment-dialog.test.tsx` e `patient-create.integration.test.tsx` | `extrair`; criar um `FormField` visual em `src/components/`, migrar os dois consumidores e manter schemas, hooks e mutações nas features |
| `CreatePatientDialog` + `AddPatientModal` | Mesma intenção visual de cadastro, mas o primeiro usa `PatientContext`/`POST patients` e o segundo usa RTK Query/`POST /patient/save` | Código dos dois componentes; teste de contrato do modal em `patient-create.integration.test.tsx`; lacuna de teste dedicado para o diálogo do contexto | `adiar por contrato`; não unificar fluxos nem estado/caches nesta change |
| Paginação específica + `components/ui/pagination` | A primeira exibe resumo e quatro botões sem callbacks; a segunda expõe links genéricos e não tem consumidor ativo confirmado | `patients-page.tsx` é o único consumidor da paginação específica; CodeGraph não encontrou consumidor de runtime para a primitive | `manter na feature`; funcionalidade e contrato de paginação ficam para change própria |
| `CardDay`, `CardPatient` e `WeekDate` legados | Renderizam fixtures e estados legados, com tipos e nomenclatura incompatíveis com a agenda atual | Consumidos pelos testes legados; README e agenda atual registram ausência de consumidor de runtime | `legado/órfão`; não promover nem remover nesta change |
| Primitives `button`, `dialog`, `input`, `label`, `table`, `calendar` | Componentes visuais genéricos já compartilhados e sem regras de domínio | Consumidores distribuídos em agenda, pacientes, autenticação e casca; imports encontrados por CodeGraph/`rg` | `manter como compartilhado`; não criar wrappers duplicados |

### Decisão do primeiro candidato

`FormField` é o único candidato aprovado para extração nesta change. Seu contrato limita-se à apresentação e acessibilidade do campo; os contratos HTTP, validação, estado, autorização e mensagens de domínio permanecem nos consumidores. Nenhum cadastro, paginação ou componente legado será movido.

## Goals / Non-Goals

**Goals:**

- Produzir um inventário comparável por feature, com localização, consumidores, comportamento, evidências e lacunas.
- Usar CodeGraph para localizar símbolos, callers e impacto, seguido da leitura do código, testes e README do módulo.
- Aplicar um limiar de reuso comprovado antes de mover código para `src/components/`.
- Separar a apresentação compartilhável das regras de domínio, chamadas HTTP, autorização, tenant e estado específico.
- Fazer cada extração em passos pequenos, com testes dos consumidores e atualização documental proporcional.

**Non-Goals:**

- Unificar os fluxos funcionais de pacientes ou escolher um novo contrato HTTP.
- Corrigir paginação, busca, autenticação, estados legados ou componentes órfãos que não sejam necessários para demonstrar uma extração aprovada.
- Criar uma biblioteca de design nova, adicionar dependências ou reorganizar todas as pastas por antecipação.

## Decisions

### Inventário orientado por símbolos e evidências

A auditoria começa por `codegraph status` e explorações direcionadas às features e componentes. Para cada resultado, o código-fonte, README e testes relacionados serão lidos antes da classificação. `rg` fica reservado para localizar textos, configurações e referências que o grafo não expressar.

Alternativa considerada: procurar somente por nomes ou classes repetidos. Foi rejeitada porque não identifica corretamente callers dinâmicos, componentes sem consumidor e diferenças de contrato entre interfaces parecidas.

### Matriz de decisão por contrato

Cada candidato será registrado com: finalidade, entradas/saídas, estado controlado, regras de acessibilidade, consumidores, contrato de dados, evidência de testes, classificação, risco e próximo passo. A classificação `extrair` exige finalidade compatível e pelo menos dois consumidores reais ou um segundo uso aprovado no mesmo escopo; `adiar por contrato` prevalece quando a apresentação depende de fluxos funcionais divergentes.

Alternativa considerada: extrair todos os blocos visuais repetidos. Foi rejeitada porque o cadastro de paciente demonstra que a mesma aparência pode esconder endpoints e mecanismos de atualização distintos.

### Fronteira de `src/components/`

Componentes aprovados para reuso entre features serão customizados, tipados e independentes de imports de qualquer feature. Primitives sem regra de negócio permanecerão em `src/components/ui/`. Hooks, schemas, adaptadores HTTP, autorização, transformação de DTO e regras de domínio permanecerão na feature ou em uma camada compartilhada explicitamente justificada.

Alternativa considerada: colocar todo componente reutilizável em `src/components/ui/`. Foi rejeitada porque `ui` já representa primitives visuais, e misturar componentes de fluxo ali tornaria a fronteira menos clara.

### Migração incremental

Após a auditoria, somente um candidato de baixo risco será extraído por vez. O consumidor original será migrado e os testes existentes serão usados como contrato; só depois será decidido se a implementação antiga pode ser removida. Candidatos bloqueados ficam documentados para uma change funcional posterior.

Alternativa considerada: uma migração ampla de todos os candidatos em um único lote. Foi rejeitada pelo risco de misturar refatoração visual com mudanças de API, estado ou permissão.

## Risks / Trade-offs

- [Contratos HTTP divergentes] → manter os dois cadastros de paciente identificáveis e exigir uma change funcional antes de qualquer unificação.
- [Falso positivo por repetição de classes Tailwind] → comparar finalidade, estados, acessibilidade e consumidores; aparência isolada não aprova extração.
- [Componente genérico com um único uso] → mantê-lo na feature até haver reuso comprovado.
- [Falhas preexistentes de build/teste] → registrar o estado observado antes da alteração e separar bloqueios existentes de regressões.
- [Quebra silenciosa de acessibilidade] → preservar nomes, associação label/erro, foco, teclado e estados anunciados nos testes dos consumidores.
- [Código legado sem callers] → classificar como órfão e não removê-lo nesta change; remoção exige verificação e escopo próprio.

## Migration Plan

1. Consolidar a matriz da auditoria e validar os consumidores com CodeGraph, leitura de fonte e testes.
2. Extrair `FormField` para `src/components/`, migrar os consumidores aprovados e preservar a lógica da feature.
4. Executar testes direcionados, lint e build; executar verificações adicionais quando houver impacto em integração.
5. Atualizar READMEs dos módulos e registrar candidatos adiados, falhas preexistentes e próximos passos.
6. Se a verificação falhar por mudança de contrato, reverter somente a extração ou mantê-la isolada e abrir uma change funcional separada; não alterar API ou dados como correção implícita.

## Open Questions

Não há questão aberta que altere a fronteira desta change. A escolha do primeiro candidato a extrair é deliberadamente posterior à matriz de evidências e não muda os requisitos da auditoria.
