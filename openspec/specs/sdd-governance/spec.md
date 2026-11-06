# sdd-governance Specification

## Purpose
Estabelece um fluxo rastreável para evoluir o produto com requisitos, impacto estrutural e evidências de validação verificáveis.

## Requirements

### Requirement: Mudanças comportamentais possuem planejamento OpenSpec ativo

Antes de alterar código, testes, dependências, contratos HTTP ou configuração que altere comportamento, o projeto MUST ter uma change ativa com proposta, spec compatível e tarefa explícita.

#### Scenario: Implementação sem artefato compatível

- **WHEN** alguém identificar que a alteração não é coberta por uma change, spec ou tarefa ativa
- **THEN** a implementação MUST aguardar a criação ou atualização desses artefatos

### Requirement: Navegação estrutural usa o índice disponível

Quando `.codegraph/` existir, a análise de símbolos, referências, callers, callees e impacto MUST começar pelo CodeGraph e confirmar os arquivos de origem relevantes.

#### Scenario: Análise de impacto antes de uma mudança

- **WHEN** uma alteração puder afetar consumidores indiretos
- **THEN** o responsável MUST consultar o impacto estrutural e os testes relacionados antes de concluir o escopo

### Requirement: Encerramento distingue evidência de intenção

Uma change MUST registrar quais verificações foram executadas, quais falharam ou ficaram bloqueadas e somente poderá ser arquivada quando suas tarefas refletirem o estado real.

#### Scenario: Verificação indisponível ou com falha preexistente

- **WHEN** build, teste, contrato externo ou ambiente não permitir confirmação completa
- **THEN** a change MUST registrar a limitação sem declarar a validação como aprovada
