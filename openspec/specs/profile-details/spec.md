# profile-details Specification

## Purpose
Permite que uma pessoa autenticada consulte seus dados seguros em um modal contextual e baixe a foto de perfil atualmente apresentada pela aplicação.

## Requirements

### Requirement: O modal apresenta os dados seguros do perfil

Ao abrir os detalhes do perfil, a aplicação MUST apresentar a identificação disponível da conta, o papel e a clínica associada, quando esses dados estiverem presentes no perfil consultado.

#### Scenario: Perfil carregado com dados completos

- **WHEN** uma pessoa abrir os detalhes enquanto o perfil tiver identificação, papel e clínica
- **THEN** o modal MUST mostrar esses valores de forma distinguível e MUST mostrar a foto de perfil atualmente exibida no topbar

#### Scenario: Campo sensível recebido no perfil

- **WHEN** a resposta do perfil contiver um campo de senha ou outro segredo
- **THEN** o modal MUST omitir esse campo e não oferecer ação para visualizá-lo ou baixá-lo

#### Scenario: Perfil ainda não disponível

- **WHEN** a pessoa abrir os detalhes antes de o perfil ser carregado ou quando a consulta falhar
- **THEN** o modal MUST comunicar que os dados não estão disponíveis e MUST manter a interface utilizável sem inventar valores

### Requirement: A pessoa pode baixar a foto de perfil exibida

O modal MUST oferecer uma ação identificada para baixar a mesma imagem de perfil apresentada no topbar, sem exigir uma chamada HTTP de domínio adicional.

#### Scenario: Download da foto disponível

- **WHEN** a pessoa ativar “Baixar foto” com uma imagem de perfil disponível
- **THEN** o navegador MUST iniciar o download da imagem com um nome de arquivo identificável e a rota atual MUST permanecer inalterada

#### Scenario: Foto indisponível

- **WHEN** não houver imagem de perfil disponível para download
- **THEN** a ação de download MUST ficar indisponível ou não ser apresentada e o modal MUST comunicar a indisponibilidade

### Requirement: O modal é fechável e acessível

O modal MUST possuir nome acessível, controle visível de fechamento, fechamento por Escape e devolver o foco ao controle que abriu os detalhes após o encerramento.

#### Scenario: Fechamento explícito

- **WHEN** a pessoa ativar o controle de fechar
- **THEN** o modal MUST ser fechado e o foco MUST retornar ao acionador do perfil

#### Scenario: Fechamento por Escape

- **WHEN** a pessoa pressionar Escape enquanto o modal estiver aberto
- **THEN** o modal MUST ser fechado sem alterar a rota ou os dados do perfil
