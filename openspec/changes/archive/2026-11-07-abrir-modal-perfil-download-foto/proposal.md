# Proposal

## Why

O menu de conta do topbar já consulta o perfil autenticado, mas a opção “Perfil” não possui ação e a pessoa não consegue revisar seus dados nem obter a imagem exibida. Um modal contextual torna essa informação acessível sem criar uma rota adicional e completa o fluxo iniciado pelo avatar mostrado na referência visual.

## What Changes

- Adicionar uma capability de detalhes do perfil em modal, aberta pelo item “Perfil” do menu da conta.
- Apresentar no modal os dados não sensíveis disponíveis no perfil: identificação da conta, papel e clínica associada, além da foto de perfil exibida no topbar.
- Disponibilizar uma ação explícita para baixar a foto de perfil, com nome de arquivo previsível e sem nova chamada de domínio.
- Permitir fechamento pelo controle visível, pela tecla Escape e pela interação de cancelamento prevista pelo modal, preservando o foco de retorno no acionador.
- Manter a consulta de perfil existente (`GET /auth/me`) como fonte dos dados e não criar rota de perfil.
- Não exibir nem baixar o campo de senha, mesmo que ele apareça indevidamente em uma resposta legada do contrato atual.

## Capabilities

### New Capabilities

- `profile-details`: exibição contextual dos dados seguros do perfil e download da foto atualmente apresentada.

### Modified Capabilities

- `application-shell-baseline`: o acesso ao perfil no topbar passa a abrir os detalhes do perfil em modal, além de continuar apresentando o menu da conta.

## Impact

- Código afetado: `src/components/account-menu.tsx`, componentes de diálogo e testes do topbar/menu de conta.
- Dados: reutilização da resposta já obtida por `GET /auth/me`; não há alteração de endpoint, payload, rota ou permissão.
- Interface: novo modal responsivo e ação de download da imagem de avatar já apresentada.
- Dependências: nenhuma nova dependência prevista; a implementação deve reutilizar os primitives de diálogo e menu existentes.
- Fora de escopo: edição de dados do perfil, upload/troca da foto, criação de endpoint para foto, alteração de senha, nova rota `/profile` e autorização de backend.
