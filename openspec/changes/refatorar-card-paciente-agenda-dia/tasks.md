# Tasks

## 1. Empacotamento temporal e quebra dos cartões

- [x] 1.1 Refatorar o modelo da grade semanal para separar grupos de intervalos sobrepostos da distribuição visual, preservar a ordem temporal estável e calcular a quantidade de linhas necessária conforme a largura útil da coluna; verificar com testes unitários que simultâneos excedentes continuam na linha seguinte a partir da esquerda e que o fim visual não causa sobreposição com a faixa seguinte.
- [x] 1.2 Atualizar a composição da matriz para reservar a altura adicional produzida pelas linhas quebradas, mantendo início, duração, fuso local e estado de cada agendamento; verificar com os testes direcionados de `weekly-grid` e os cenários existentes de duração/simultaneidade.

## 2. Apresentação do card e interação da linha horária

- [x] 2.1 Ajustar a apresentação dos cartões para mostrar somente o primeiro nome, remover rolagem interna nos eixos horizontal e vertical e preservar nome completo, serviço, horário e estado em descrição acessível/dica contextual; verificar na integração da página o texto visível e a ausência de overflow de rolagem no card.
- [x] 2.2 Implementar o destaque compartilhado da linha horária sobre a régua e as cinco colunas, removendo-o ao sair da linha sem alterar seleção, dados ou chamadas HTTP; verificar na integração os estados de hover/foco da linha `07:00` e a permanência dos cards acima da camada visual.
- [x] 2.3 Atualizar a cobertura de integração da agenda para quatro ou mais cards simultâneos, nome com múltiplos termos, serviço longo, viewport estreita e hover da linha; verificar que o contrato visual de status, legenda, rolagem horizontal controlada da matriz e acessibilidade existentes continuam aprovados.

## 3. Verificação da change

- [x] 3.1 Executar os testes afetados de agenda e o lint, registrando o resultado real; qualquer falha preexistente ou bloqueio de ambiente deve ser documentado na change.
- [x] 3.2 Executar `npm run build` e `openspec validate refatorar-card-paciente-agenda-dia --strict`, corrigindo inconsistências dos artefatos ou registrando falhas não relacionadas antes de solicitar implementação/revisão.

## Workflow follow-up

- Arquivar a change somente depois que a implementação, revisão e verificações estiverem concluídas e as tarefas refletirem evidência real.
