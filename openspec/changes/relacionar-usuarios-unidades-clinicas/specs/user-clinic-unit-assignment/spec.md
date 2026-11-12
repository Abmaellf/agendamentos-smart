# Spec Delta

## Purpose

Define o vínculo verificável entre usuários, clínicas e unidades clínicas para administrar acesso operacional e preservar o contexto organizacional da sessão.

## ADDED Requirements

### Requirement: Usuários não administradores são associados a uma unidade da própria clínica
O sistema MUST manter para cada usuário não administrador uma `clinic_unit` pertencente à sua clínica. A associação MUST compor o contexto de sessão usado pelas operações protegidas.

#### Scenario: Usuário básico com associação válida
- **WHEN** um usuário não administrador possuir uma clínica e uma unidade clínica associada pertencente a essa clínica
- **THEN** a sessão MUST identificar a clínica e a unidade associadas ao usuário

#### Scenario: Tentativa de associar unidade de outra clínica
- **WHEN** for solicitada uma associação entre um usuário e uma unidade que não pertença à clínica do usuário
- **THEN** o sistema MUST rejeitar a solicitação e preservar a associação anterior

### Requirement: Administradores têm acesso a todas as unidades da sua clínica
O sistema MUST conceder a todo usuário administrador acesso a todas as `clinic_unit` pertencentes à sua clínica, sem restringi-lo à unidade associada a usuários não administradores.

#### Scenario: Administrador consulta unidades da clínica
- **WHEN** um administrador autenticado solicitar as unidades disponíveis
- **THEN** o sistema MUST retornar todas as unidades pertencentes à clínica do administrador

#### Scenario: Administrador acessa uma unidade diferente da unidade padrão
- **WHEN** um administrador autenticado operar em qualquer unidade pertencente à sua clínica
- **THEN** o sistema MUST permitir a operação conforme as demais permissões aplicáveis

### Requirement: Somente administrador gerencia associações de usuários a unidades
O sistema MUST permitir criar ou alterar a associação de usuário a clínica e `clinic_unit` somente a um administrador autenticado. Ao criar um usuário, a solicitação administrativa MUST informar a clínica e a unidade clínica de destino.

#### Scenario: Administrador cria usuário com clínica e unidade
- **WHEN** um administrador autenticado criar um usuário informando uma clínica e uma unidade pertencente a ela
- **THEN** o sistema MUST criar o usuário com a associação informada

#### Scenario: Administrador omite clínica ou unidade na criação
- **WHEN** um administrador autenticado tentar criar um usuário sem clínica ou sem unidade clínica
- **THEN** o sistema MUST rejeitar a criação e indicar os campos obrigatórios ausentes

#### Scenario: Usuário não administrador tenta gerir associação
- **WHEN** um usuário não administrador tentar criar ou alterar a associação de outro usuário a uma clínica ou unidade clínica
- **THEN** o sistema MUST negar a operação e não alterar vínculos existentes

### Requirement: Usuários existentes recebem associação inicial de unidade
O sistema MUST associar todos os usuários existentes à `MATRIZ` da sua própria clínica, preservando seus demais dados e os privilégios de administradores.

#### Scenario: Migração de usuários existentes
- **WHEN** a migração de associação de usuários for executada sobre os registros existentes
- **THEN** cada usuário existente MUST ficar associado à `MATRIZ` da sua clínica sem perda dos demais atributos

#### Scenario: Administrador após a migração
- **WHEN** um usuário administrador existente receber a associação inicial
- **THEN** ele MUST continuar com acesso a todas as unidades da sua clínica
