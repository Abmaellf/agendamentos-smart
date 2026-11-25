# Tasks

## 1. Container responsivo da listagem

- [x] 1.1 Ajustar a composição de `PackagesPage` para usar um container mais
  largo e responsivo em viewports amplas, preservando margens, alinhamento e o
  overflow horizontal restrito à tabela; verificar a renderização nos
  breakpoints disponíveis e a ausência de overflow horizontal da página.
- [x] 1.2 Atualizar o teste da página para confirmar que filtros, tabela,
  paginação e ações continuam presentes dentro do container ampliado; verificar
  com o teste de integração da feature de pacotes.

## 2. Modal de detalhes do pacote

- [x] 2.1 Adaptar o conteúdo de `PackageDetailPanel` para um diálogo modal
  responsivo, preservando campos, descrição, dias, estados de carregamento/erro
  e ações administrativas; verificar os cenários carregado, carregando e erro
  no teste da página.
- [x] 2.2 Atualizar `PackagesPage` para abrir o modal ao selecionar a linha ou
  acionar `Detalhes`, separar abertura de detalhe da seleção e manter filtros,
  página e seleção ao fechar; verificar abertura por botão, clique/teclado,
  fechamento e troca de seleção em testes RTL.
- [x] 2.3 Garantir semântica de diálogo, foco inicial, contenção de foco e
  retorno ao controle de origem, incluindo a transição para o modal de
  criação/edição; verificar roles, foco e sequência detalhe-editar-cancelar nos
  testes da feature.

## 3. Documentação e integração

- [x] 3.1 Atualizar `src/features/packages/README.md` para descrever o
  container responsivo e o modal de detalhes, sem alterar contratos HTTP;
  verificar que a documentação corresponde à composição implementada.
- [x] 3.2 Executar os testes direcionados da feature de pacotes e registrar
  qualquer falha preexistente separadamente; verificar listagem, filtros,
  paginação, detalhe, modais e autorização ADMIN/BASIC.
- [x] 3.3 Executar `npm run lint`, `npm run build` e
  `openspec validate ajustar-container-e-detalhes-modal-pacotes --strict`;
  verificar que não há falhas introduzidas pela change e registrar bloqueios
  comprovadamente preexistentes.

## Workflow follow-up

- Solicitar revisão dos artefatos antes de iniciar a aplicação da change.
- Arquivar a change somente após concluir as tarefas, validar estritamente e
  confirmar a promoção da capability para `openspec/specs/`.
