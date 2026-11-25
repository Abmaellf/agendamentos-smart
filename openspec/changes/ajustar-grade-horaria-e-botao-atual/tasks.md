# Tasks

## 1. Expandir a janela temporal da agenda

- [x] 1.1 Atualizar as constantes e os cálculos compartilhados da grade para que a área temporal termine em 20:00, preservando o início às 07:00 e evitando uma faixa extra 20:00–21:00; verificar com os testes unitários do modelo da grade.
- [x] 1.2 Atualizar o teste de integração da página para exigir o rótulo `20:00`, preservar a régua completa e incluir um agendamento iniciado próximo do limite, como 19:30; verificar com `npm run test -- src/features/appointments/__tests__/weekly-grid.test.ts src/features/appointments/__tests__/appointments-page.integration.test.tsx --run`.

## 2. Reposicionar e estilizar o botão da hora corrente

- [x] 2.1 Alterar a composição da ação corrente para que o centro do botão coincida com a borda entre o dia atual e o próximo, acompanhe `currentRow` e a rolagem da matriz, e use o fallback interno da última coluna; cobrir a ancoragem e a ausência de botão fora da janela com `src/features/appointments/__tests__/current-hour-action.integration.test.tsx`.
- [x] 2.2 Aplicar ao botão o fundo derivado de `#6F3CFF` com transparência aproximada de 80%, diâmetro de 53 px e estados de foco/hover roxos, sem alterar `aria-expanded`, teclado, propagação de eventos ou a mutação existente; verificar estilo, foco e ação com os testes direcionados de `current-hour-action.integration.test.tsx`.

## 3. Documentar e validar a entrega

- [x] 3.1 Atualizar a seção “Iniciar atendimentos da hora corrente” de `src/features/appointments/README.md` para registrar a régua até 20:00 e a nova ancoragem/apresentação do botão; verificar a consistência textual com `rg` e revisão do arquivo.
- [x] 3.2 Executar `npm run lint`, `npm run build` e `openspec validate ajustar-grade-horaria-e-botao-atual --strict`; registrar no encerramento eventuais falhas preexistentes ou bloqueios reais.
- [ ] 3.3 Realizar inspeção visual local em viewport larga e estreita, confirmando o centro do botão na divisão entre dias, o comportamento com linha corrente expandida, a rolagem horizontal, o limite 20:00 e o contraste/foco; registrar o resultado antes de marcar a change como concluída.

## Workflow follow-up

- Validar a change novamente após todas as tarefas e somente então solicitar revisão para implementação.
- Arquivar a change apenas depois da implementação concluída, dos testes registrados e da atualização da spec principal.
