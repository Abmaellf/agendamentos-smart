# Spec Delta

## ADDED Requirements

### Requirement: O perfil apresenta a clínica e a unidade da sessão
Os detalhes do perfil MUST apresentar, de forma distinguível, o nome da clínica e o nome da `clinic_unit` que compõem o contexto da sessão autenticada, quando esses dados estiverem disponíveis.

#### Scenario: Perfil com contexto organizacional completo
- **WHEN** uma pessoa abrir os detalhes do perfil e a sessão contiver os nomes da clínica e da unidade clínica
- **THEN** o modal MUST mostrar o nome da clínica e o nome da unidade em campos distinguíveis

#### Scenario: Contexto organizacional indisponível
- **WHEN** uma pessoa abrir os detalhes do perfil e a consulta não fornecer o nome da clínica ou da unidade clínica
- **THEN** a interface MUST comunicar a indisponibilidade sem inventar valores

### Requirement: A identidade visual identifica a clínica e a unidade da sessão
A identidade visual exibida na aplicação MUST apresentar o nome da clínica e o nome da `clinic_unit` do contexto da sessão, mantendo um nome acessível que permita identificar ambos.

#### Scenario: Marca com clínica e unidade disponíveis
- **WHEN** a aplicação renderizar a identidade visual com dados de clínica e unidade disponíveis na sessão
- **THEN** a identidade MUST mostrar os dois nomes e seu nome acessível MUST identificá-los

#### Scenario: Marca enquanto o contexto está indisponível
- **WHEN** a identidade visual for renderizada antes de os dados de clínica e unidade estarem disponíveis ou quando a consulta falhar
- **THEN** a aplicação MUST permanecer utilizável e não apresentar nomes fictícios como se fossem o contexto da sessão
