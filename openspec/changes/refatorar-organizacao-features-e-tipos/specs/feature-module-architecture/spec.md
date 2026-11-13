# Spec Delta

## Purpose

Define uma organização de módulos por domínio que torne pacientes uma feature
autocontida, mantenha contratos compartilhados consistentes e ofereça um padrão
repetível para os próximos domínios da aplicação.

## ADDED Requirements

### Requirement: O domínio de pacientes possui uma fronteira única de feature

O código específico de pacientes MUST ter `src/features/patients` como sua
localização canônica, sem consumidores ativos dependerem dos caminhos legados
de página, contexto, API ou componentes específicos após a migração.

#### Scenario: Inventário estrutural após a migração

- **WHEN** os arquivos e imports do fluxo de pacientes forem auditados
- **THEN** a página, componentes específicos, estado remoto/compartilhado,
  adaptadores HTTP e testes de pacientes MUST estar sob a fronteira de
  `src/features/patients` ou em módulos explicitamente compartilhados

#### Scenario: Rota existente preservada

- **WHEN** uma pessoa autenticada acessar `/paciente`
- **THEN** a aplicação MUST montar a tela de pacientes a partir da nova
  feature, preservando a rota e os estados observáveis já existentes

### Requirement: Cada feature de domínio segue um limite previsível

Uma feature de domínio MUST concentrar sua composição de rota, componentes
específicos, modelo/regras, adaptadores de API e testes próximos ao domínio,
enquanto componentes visuais genéricos e infraestrutura transversal MUST
permanecer fora da feature.

#### Scenario: Criação de uma nova feature

- **WHEN** um novo domínio funcional for introduzido
- **THEN** seu código específico MUST ser organizado em `src/features/<domain>`
  com subpastas aplicáveis de `api`, `components`, `model`, `pages` e
  `__tests__`, além de README quando o limite exigir documentação própria

#### Scenario: Componente compartilhado reutilizado

- **WHEN** um componente for usado por dois ou mais domínios sem regra de
  negócio específica
- **THEN** ele MUST permanecer ou ser promovido para uma área compartilhada,
  sem importar estado, API ou contratos privados de uma feature

### Requirement: Contratos compartilhados possuem uma definição canônica

Tipos de domínio, entradas/saídas de API ou contratos usados entre módulos MUST
ser definidos uma única vez em `src/@types`, organizados por domínio ou camada
compartilhada e consumidos com imports de tipo explícitos.

#### Scenario: Tipo compartilhado entre módulos

- **WHEN** um tipo de paciente, agendamento, sessão, usuário, profissional ou
  serviço for consumido por mais de um módulo
- **THEN** os consumidores MUST importar o contrato canônico de `src/@types`
  e não redefinir uma interface equivalente localmente

#### Scenario: Tipo privado de implementação

- **WHEN** um tipo for trivial, inferido de um schema ou usado por um único
  consumidor sem representar contrato de domínio/API
- **THEN** ele MAY permanecer próximo ao consumidor e não MUST ser movido para
  `src/@types` apenas para preencher uma convenção

### Requirement: A auditoria de tipos cobre os módulos existentes

Durante a refatoração, os módulos de pacientes, agendamentos, sessão,
autenticação e componentes compartilhados MUST ser auditados para redirecionar
consumidores aos contratos canônicos e registrar como lacuna qualquer contrato
cuja equivalência ou origem externa não possa ser comprovada.

#### Scenario: Tipo duplicado identificado

- **WHEN** a auditoria encontrar duas declarações que representam o mesmo
  contrato de domínio ou transporte
- **THEN** uma única declaração MUST ser escolhida em `src/@types`, os imports
  MUST ser redirecionados e a duplicata MUST ser removida ou documentada como
  deliberadamente distinta

#### Scenario: Contratos sem evidência suficiente

- **WHEN** uma interface local não puder ser alinhada com o contrato real da
  API ou com outro tipo existente
- **THEN** a implementação MUST preservar a forma atual, registrar a lacuna
  nos artefatos/documentação da change e não inventar campos de domínio

### Requirement: A convenção prepara os próximos domínios sem antecipar produto

O padrão MUST ser aplicável às futuras features `professionals`, `services`,
`reports`, `financial` e `users`, sem exigir a criação de rotas, telas,
endpoints ou regras funcionais desses domínios nesta refatoração.

#### Scenario: Novo domínio iniciado posteriormente

- **WHEN** uma futura change iniciar um desses domínios
- **THEN** ela MUST poder seguir a mesma convenção de fronteira, contratos,
  testes e documentação sem depender de `src/page`, `src/context` ou de uma
  API global específica de outra feature

#### Scenario: Domínio ainda não implementado

- **WHEN** a refatoração for concluída sem implementação funcional de um futuro
  domínio
- **THEN** o repositório MUST continuar sem declarar rota ou capacidade como
  entregue apenas por existir a convenção arquitetural

### Requirement: A movimentação não altera contratos funcionais existentes

A reorganização MUST preservar os caminhos de rota, endpoints, formatos de
entrada/saída e regras observáveis dos fluxos tocados, salvo alteração
explicitamente aprovada em uma change funcional separada.

#### Scenario: Verificação de compatibilidade

- **WHEN** os testes e a checagem de build forem executados após a migração
- **THEN** os consumidores MUST resolver os novos imports e os fluxos de
  pacientes e agendamentos MUST manter seus contratos conhecidos

#### Scenario: Problema legado descoberto

- **WHEN** a movimentação revelar endpoint, payload, ação ou estado incompleto
- **THEN** o problema MUST ser registrado como débito ou bloqueio e não MUST
  ser corrigido silenciosamente dentro desta refatoração
