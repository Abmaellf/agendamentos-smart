# Proposal

## Why

O cabeçalho atual da agenda apresenta apenas o título e a descrição, não reproduzindo a referência visual fornecida nem deixando explícita a visualização semanal ativa. O ajuste melhora a identificação da tela e alinha o menu central de agendamentos ao padrão visual esperado antes de evoluir para outros modos de agenda.

## What Changes

- Atualizar o cabeçalho da página de agendamentos para apresentar, à esquerda, um ícone de calendário em um bloco verde arredondado, o título “Agendamentos” e o subtítulo “Visualize e gerencie os atendimentos da semana.”.
- Apresentar, à direita, um seletor segmentado com ícones e os rótulos “Semana”, “Dia” e “Lista”, reproduzindo a composição, hierarquia, cores e estados visuais da imagem de referência.
- Destacar “Semana” como a opção ativa e preservar a agenda semanal atualmente entregue; “Dia” e “Lista” serão apresentados como opções visuais sem criar modos de agenda, rotas ou contratos novos nesta change.
- Garantir nomes acessíveis, indicação programática da opção ativa e comportamento responsivo sem rolagem horizontal ou sobreposição do conteúdo.

### Fora de escopo

- Implementar consultas, layouts ou regras de negócio para visualizações diária e em lista.
- Alterar a navegação temporal do topbar, a ação “Agendar”, rotas, permissões, dados ou contratos HTTP.

## Capabilities

### New Capabilities

<!-- Nenhuma capability nova; o ajuste pertence à capability durável da agenda semanal. -->

### Modified Capabilities

- `weekly-appointments`: ajustar o cabeçalho da agenda e estabelecer o seletor visual de visualização conforme a referência fornecida, mantendo a semana como modo funcional entregue.

## Impact

- Código afetado: composição visual de `AppointmentsPage` e seus testes de interface/integração.
- O comportamento de consulta semanal, estados de carregamento/erro/vazio, criação de agendamento e navegação temporal permanece inalterado.
- Não há impacto em API, rotas, dados, permissões ou dependências externas.
