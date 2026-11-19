# Spec Delta

## Purpose

Estabelece uma auditoria verificável para encontrar duplicações de interface entre features, decidir quando há reutilização real e orientar a promoção segura de componentes customizados para a área compartilhada da aplicação.

## ADDED Requirements

### Requirement: A auditoria cobre as interfaces das features e suas evidências

A auditoria MUST inventariar as features implementadas, suas páginas e componentes, os componentes compartilhados relacionados e os testes que demonstram seu comportamento.

#### Scenario: Inventário de uma feature implementada

- **WHEN** uma feature for analisada
- **THEN** o registro MUST informar os locais analisados, os consumidores conhecidos, o comportamento representado e a evidência disponível em código, testes ou documentação

#### Scenario: Lacuna de evidência

- **WHEN** uma interface não possuir teste, consumidor identificado ou contrato confirmado
- **THEN** o registro MUST marcar a lacuna explicitamente e não MUST tratá-la como comportamento entregue

### Requirement: A auditoria distingue duplicação de semelhança visual

Um candidato MUST ser considerado duplicação somente quando repetir finalidade e comportamento compatíveis; aparência, uso do mesmo primitive ou nomes semelhantes, isoladamente, não MUST justificar extração.

#### Scenario: Estruturas visualmente parecidas com contratos diferentes

- **WHEN** duas interfaces tiverem aparência semelhante, mas usarem contratos, estados ou regras de domínio diferentes
- **THEN** a auditoria MUST mantê-las separadas ou classificá-las como bloqueadas até que o contrato alvo seja decidido

#### Scenario: Regra de domínio exclusiva

- **WHEN** uma interface depender de autorização, persistência, catálogo ou regra própria de uma feature
- **THEN** a parte específica MUST permanecer na feature, mesmo que sua apresentação compartilhe elementos visuais com outra tela

### Requirement: Cada candidato recebe uma decisão rastreável

O inventário MUST classificar cada candidato como `extrair`, `manter na feature`, `adiar por contrato`, `legado/órfão` ou `fora do escopo`, registrando justificativa, consumidores, risco e próximo passo.

#### Scenario: Fluxos de criação de paciente

- **WHEN** a auditoria analisar os dois fluxos atuais de criação de paciente
- **THEN** MUST registrar que eles possuem contratos HTTP e integrações de estado distintos e MUST exigir uma decisão funcional antes de unificar qualquer comportamento

#### Scenario: Paginação e primitives existentes

- **WHEN** a auditoria comparar a paginação específica de pacientes com a primitive de paginação compartilhada
- **THEN** MUST comparar API, comportamento, acessibilidade, estado funcional e consumidores, sem substituir uma pela outra apenas por reutilizar os mesmos botões

#### Scenario: Componente sem consumidor

- **WHEN** um componente legado não tiver consumidor confirmado
- **THEN** MUST ser classificado como legado/órfão e não MUST ser promovido ou removido sem uma decisão e verificação próprias

### Requirement: Componentes customizados aprovados usam a área compartilhada padrão

Quando um candidato for aprovado para uso por mais de uma feature, sua interface compartilhada MUST ficar disponível em `src/components/`; primitives visuais genéricas MUST continuar em `src/components/ui/`, e a área compartilhada MUST permanecer independente de regras internas de uma feature.

#### Scenario: Reutilização entre features

- **WHEN** o mesmo comportamento visual for necessário em duas ou mais features com contrato compatível
- **THEN** a implementação compartilhada MUST expor entradas tipadas, receber estado e ações por contrato e ser consumível sem importar lógica de domínio de uma feature específica

#### Scenario: Candidato de uso único

- **WHEN** um componente tiver somente um consumidor ou ainda não houver segundo caso de uso confirmado
- **THEN** MUST permanecer junto à feature até existir evidência de reutilização, salvo decisão documentada em contrário

### Requirement: Uma extração preserva os contratos observáveis existentes

Uma extração aprovada MUST preservar comportamento visual e interativo, acessibilidade, mensagens e estados cobertos; mudanças em rotas, contratos HTTP, dados, permissões ou regras de domínio MUST exigir uma change funcional compatível.

#### Scenario: Extração sem mudança de domínio

- **WHEN** um componente for movido ou generalizado sem alteração do fluxo de negócio
- **THEN** as telas consumidoras MUST manter as mesmas ações, estados de carregamento/erro/vazio, validações, nomes acessíveis e resultados

#### Scenario: Extração que revela contrato divergente

- **WHEN** a reutilização exigir alterar endpoint, payload, autorização, estado persistido ou regra de negócio
- **THEN** a extração MUST ser interrompida ou isolada e a divergência MUST ser registrada como requisito de uma change própria

### Requirement: A promoção de um componente é verificável e documentada

Toda promoção MUST registrar os consumidores migrados, os consumidores não migrados, os testes relevantes e o resultado de lint, build e testes proporcionais; documentação de módulo MUST ser atualizada quando a responsabilidade de uma pasta mudar.

#### Scenario: Validação de candidato promovido

- **WHEN** um candidato for extraído para a área compartilhada
- **THEN** a verificação MUST cobrir os consumidores afetados e MUST demonstrar ausência de regressão ou declarar falhas preexistentes e bloqueios reais

#### Scenario: Auditoria concluída sem extração

- **WHEN** a análise concluir que nenhum candidato tem contrato compatível e reuso comprovado
- **THEN** MUST entregar o inventário e as decisões sem criar um componente genérico artificial
