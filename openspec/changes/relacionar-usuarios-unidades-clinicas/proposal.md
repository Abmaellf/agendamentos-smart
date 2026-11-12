# Proposal

## Why

Usuários básicos ainda não possuem uma unidade clínica associada de modo verificável, o que impede o isolamento correto dos dados de agenda e a apresentação do contexto organizacional da sessão. A associação explícita permite que a API aplique a fronteira de acesso por unidade e que a interface comunique a clínica e a unidade em uso.

## What Changes

- Introduzir a associação de cada usuário não administrador a uma `clinic_unit` da sua clínica.
- Definir que administradores têm acesso a todas as unidades clínicas da clínica a que pertencem, sem associação restritiva a uma única unidade.
- Migrar cada usuário existente para a unidade `MATRIZ` da sua própria clínica.
- Restringir a criação e a alteração dessa associação a administradores autenticados, exigindo clínica e unidade no cadastro de um usuário realizado por administrador.
- Incluir os nomes da clínica e da unidade da sessão nos dados de perfil e na identidade visual exibida pela aplicação.
- Fazer com que a consulta de agendamentos de um usuário não administrador retorne somente pacientes e agendamentos da sua unidade associada; a API continua sendo responsável por aplicar a autorização e o isolamento.

## Capabilities

### New Capabilities

- `user-clinic-unit-assignment`: associa usuários a unidades clínicas, controla quem pode gerir a associação e preserva os dados existentes durante a migração.

### Modified Capabilities

- `profile-details`: o perfil e a identidade da aplicação passam a apresentar a clínica e a unidade associadas à sessão.
- `weekly-appointments`: a agenda passa a respeitar o escopo de unidade do usuário não administrador.

## Impact

- Dados e migração: novo relacionamento de usuário para `clinic_unit` e preenchimento dos usuários existentes com a unidade fixa informada.
- API: contratos de sessão/perfil, criação e gestão de usuários e consultas de agenda/pacientes devem transportar ou impor o contexto de clínica e unidade; respostas incompatíveis são uma mudança contratual coordenada com o backend.
- Frontend: modelos de sessão, componentes de perfil e marca, consultas de agenda e seus testes precisarão refletir o contexto recebido, sem substituir a autorização do servidor.
- Fora de escopo: seleção de unidade pelo usuário básico, alteração de outras regras de tenant, migração de dados fora dos usuários existentes e implementação de gestão ampla de clínicas/unidades.
