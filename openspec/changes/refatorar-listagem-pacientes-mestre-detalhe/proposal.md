# Proposal

## Why

A rota `/paciente` já possui paginação, filtros e cadastro, mas sua composição
é diferente da listagem de pacotes: a página concentra estrutura visual, a
linha ainda carrega ações indisponíveis e não existe detalhe contextual. Isso
dificulta a leitura administrativa e mantém dois padrões visuais para telas de
catálogo que precisam ser operadas da mesma forma.

Esta change aplica à listagem de pacientes o padrão mestre-detalhe consolidado
em `refatorar-listagem-pacotes-mestre-detalhe` e
`ajustar-container-e-detalhes-modal-pacotes`, além de identificar os shells
visuais que podem ser componentes globais sem carregar regra de domínio.

## What Changes

- Reorganizar a rota `/paciente` em uma página administrativa com resumo
  contextual: ícone, título, descrição da área e ação de novo paciente.
- Usar um container responsivo amplo, com fundo, espaçamento, alinhamento e
  tratamento de overflow consistentes com a tela de pacotes.
- Manter filtros e paginação controlados, reiniciando na primeira página ao
  aplicar ou limpar critérios e preservando estados de carregamento, erro e
  vazio.
- Apresentar os pacientes em tabela semântica dentro de um card visual,
  mantendo código, nome, serviço principal quando disponível, status, data e
  ações compatíveis com os contratos existentes.
- Permitir selecionar um paciente e abrir um modal de detalhe acessível,
  preservando filtros, paginação e contexto da listagem ao fechar.
- Reorganizar o cadastro em um modal de formulário que possa ser reutilizado
  para edição quando existir contrato HTTP de edição; não criar requisições
  fictícias para edição ou desativação.
- Extrair, quando houver reuso comprovado entre pacientes e pacotes, shells
  globais apresentacionais para resumo de página, container de listagem, card de
  tabela/paginação e modal; esses componentes receberão conteúdo, estado e
  callbacks por propriedades e não conhecerão API, tenant ou papel de usuário.
- Harmonizar as estilizações de marca já observadas nos pacotes: verde da
  aplicação, cabeçalho contrastante, bordas arredondadas, sombras discretas,
  avatar por iniciais, status textual com indicação visual, zebra/hover/foco e
  responsividade.
- Atualizar tipos, adaptadores, testes e README da feature conforme o contrato
  real de pacientes.

Fora de escopo: prontuário ou histórico clínico, nova rota, exclusão física,
alteração do isolamento por clínica/unidade, novas regras de status, nova
dependência visual e deploy. Edição e desativação só serão habilitadas se os
respectivos contratos HTTP e autorizações forem confirmados; até lá, a
interface deverá mantê-las indisponíveis ou fora do fluxo.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `legacy-patient-management`: atualizar a experiência de listagem, filtros,
  paginação, resumo visual, detalhe modal e cadastro sem declarar como
  entregues ações de domínio que ainda não possuem contrato.

## Impact

- Frontend: `src/features/patients`, tipos e adaptadores de paciente, testes da
  rota `/paciente` e componentes visuais compartilhados em `src/components`.
- Contrato HTTP atual: preservar `GET /patient/list` e `POST /patient/save`,
  incluindo apenas parâmetros e campos que a API realmente suporte.
- Contratos potenciais: detalhe, edição e desativação devem ser alinhados com a
  API antes de qualquer mutation; a ausência desses contratos não poderá ser
  mascarada por estado local.
- UX e acessibilidade: tabela semântica, estados remotos comunicados, modal
  com foco contido/retornado, ações nomeadas e layout sem overflow horizontal
  da página.
- Documentação: atualizar o README de pacientes e, se um shell visual passar a
  ser consumido por mais de uma feature, registrar sua responsabilidade no
  README de componentes sem mover regras de negócio para a camada global.
