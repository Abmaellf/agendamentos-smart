# Proposal

## Why

As features são compostas por componentes locais, primitives em `src/components/ui/` e componentes compartilhados legados com níveis diferentes de maturidade. A ausência de uma auditoria explícita dificulta distinguir duplicação real de semelhança visual e aumenta o risco de corrigir uma implementação sem corrigir suas cópias.

Agora é o momento adequado para registrar um inventário antes da expansão das features planejadas, preservando regras de domínio nas features e adotando `src/components/` como destino padrão para componentes customizados comprovadamente reutilizáveis.

## What Changes

- Criar uma auditoria rastreável das interfaces em `src/features/`, páginas relacionadas e componentes compartilhados, identificando estruturas, comportamentos e padrões repetidos.
- Classificar cada candidato como reutilizável, específico de domínio, legado/órfão ou bloqueado por contrato ainda divergente, com evidências de consumidores e testes.
- Definir critérios para extrair componentes customizados compartilhados para `src/components/`, mantendo primitives genéricas em `src/components/ui/` e regras de negócio dentro da feature responsável.
- Priorizar candidatos de baixo risco e registrar uma decisão para os fluxos de criação de paciente, para a paginação de pacientes, para campos com validação e para componentes legados da agenda.
- Especificar a verificação necessária para qualquer extração, incluindo preservação de acessibilidade, comportamento, testes, rotas, contratos HTTP, dados e permissões.
- Atualizar a documentação dos módulos afetados quando a auditoria ou uma extração alterar a responsabilidade de uma pasta.

Fora de escopo nesta change: implementar os componentes extraídos, unificar os dois contratos de criação de paciente, corrigir a paginação funcional, alterar endpoints, rotas, autorização, modelos de dados ou remover componentes legados sem uma decisão própria e evidência de ausência de consumidores.

## Capabilities

### New Capabilities

- `feature-ui-reuse-audit`: inventário, classificação e critérios de decisão para identificar duplicações entre features e promover componentes customizados reutilizáveis para `src/components/`.

### Modified Capabilities

- Nenhuma. As capacidades de agenda, pacientes e casca visual permanecem com os mesmos requisitos observáveis; esta change organiza uma auditoria e um plano de extração sem alterar seu comportamento.

## Impact

- Áreas analisadas: `src/features/appointments`, `src/features/patients`, `src/features/session`, `src/components/`, `src/page/` quando houver padrão compartilhável e os testes correspondentes.
- A implementação futura poderá mover ou adaptar componentes React/TypeScript, mas deverá conservar os contratos públicos e os comportamentos cobertos pelas specs existentes.
- Não há alteração prevista em API, dependências, rotas, persistência, tenant, permissões ou dados nesta etapa.
- A auditoria deverá apontar impactos de cada candidato antes de qualquer alteração de código e separar lacunas preexistentes de regressões introduzidas.
