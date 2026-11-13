# Proposal

## Why

A agenda manual só permite criar atendimentos isolados e não possui um cadastro configurável de pacotes por unidade. A clínica precisa que administradores definam pacotes de um serviço com total de sessões, dias semanais e preço próprio, preservando os agendamentos que venham a usar essas condições.

## What Changes

- Criar a capability de gestão administrativa de pacotes de serviços, vinculados obrigatoriamente a uma única unidade da clínica autorizada.
- Permitir a administradores criar, consultar, filtrar, editar enquanto sem agendamentos vinculados, ativar e desativar pacotes; não haverá exclusão física.
- Definir que cada pacote associa um serviço existente, nome, descrição opcional, total positivo de sessões, conjunto único de um a sete dias da semana, frequência semanal derivada desses dias, preço total em moeda decimal e situação ativa/inativa.
- Não associar profissional nem horário ao pacote nesta etapa. Validação contra funcionamento da unidade, feriados e bloqueios permanece fora de escopo até haver uma capability de calendário/disponibilidade.
- Definir o ponto de integração para a SPEC 02: ao haver qualquer agendamento de pacote associado, sua definição passa a ser imutável; a SPEC 02 definirá a contratação, o snapshot e a geração automática das ocorrências.
- Tornar “Serviços” uma área navegável e incluir Pacotes como seu submenu; adicionar ao lado de “Agendar” o botão “Agendamento de Pacotes”, inicialmente indisponível e sem operação de domínio até a SPEC 02.
- Propor contratos HTTP, entidades de API e validações do servidor. **BREAKING**: a API externa ganhará endpoints e entidades de pacote; esta change não pressupõe que o frontend consiga autorizar, isolar ou validar essas regras sozinho.

## Capabilities

### New Capabilities

- `service-package-management`: permite administrar definições de pacotes por unidade, com regras de integridade, consulta, ativação e desativação.

### Modified Capabilities

- `application-shell-baseline`: disponibiliza a entrada Serviços/Pacotes e o controle temporariamente indisponível “Agendamento de Pacotes” no topbar sem remover a ação manual existente.

## Impact

- API e dados: novas entidades de pacote e de dias configurados, migration, validação financeira e de escopo unidade/clínica, autorização administrativa e endpoints de CRUD/ativação.
- Frontend: nova feature `packages`, rota e submenu sob Serviços, adaptador RTK Query, contratos tipados, formulários Zod, telas de listagem/detalhe/edição e testes; o topbar receberá o segundo botão.
- Dependências: reutiliza os catálogos atuais de serviços e unidades, além da sessão. Depende da resolução da change `relacionar-usuarios-unidades-clinicas` para o escopo de unidade e deverá coordenar qualquer contrato com a API irmã.
- Fora de escopo: contratação de pacote por paciente, data/hora inicial, geração automática de agendamentos, seleção de profissional, disponibilidade intradiária, horário de funcionamento, feriados, bloqueios e exclusão física.
