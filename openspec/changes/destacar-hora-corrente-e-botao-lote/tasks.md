# Tasks

## 1. Agrupamento e destaque da hora corrente

- [x] 1.1 Manter o hover verde em toda a linha da hora e as células de dia + hora sem borda roxa no estado normal, dimensionando a célula corrente pela geometria efetiva dos cartões simultâneos; verificar com teste de integração contendo múltiplos pacientes.
- [x] 1.2 Aplicar simultaneamente o hover de borda `solid` de `1px` em `#6F3CFF` somente sobre a célula dia + hora sob o cursor, sem bloquear a seleção dos cartões ou disparar chamadas HTTP; verificar com testes de mouse/foco e confirmar a permanência do hover verde na linha.

## 2. Botão simples e atualização em lote

- [ ] 2.1 Reposicionar somente o botão circular “+” no canto inferior direito da área corrente, aplicando `border-radius: 50%` e mantendo removidos diagonal, clip-path e área triangular, com fallback para a última coluna e suporte à rolagem horizontal; verificar marcadores de ancoragem, formato circular e a inspeção visual em viewport larga e estreita.
- [x] 2.2 Preservar nome acessível, foco, `aria-expanded`, estados de carregamento/desabilitação e o fluxo de confirmação da ação; verificar que o acionamento confirmado gera uma única chamada da operação de lote e que nenhum agendamento fora da hora corrente é enviado ou alterado.
- [x] 2.3 Cobrir a ausência de agendamentos elegíveis com controle/opção desabilitado e mensagem correspondente; verificar o cenário com a suíte direcionada de `current-hour-action.integration.test.tsx`.

## 3. Documentação e validação integrada

- [x] 3.1 Atualizar a seção da agenda em `src/features/appointments/README.md` para descrever o hover verde da linha e a borda `1px solid #6F3CFF` somente na célula dia + hora sob o cursor; verificar a consistência com `rg` e revisão do arquivo.
- [x] 3.2 Executar os testes direcionados da agenda, `npm run lint`, `npm run build` e `openspec validate destacar-hora-corrente-e-botao-lote --strict`; registrar no encerramento qualquer falha preexistente ou bloqueio real.
- [ ] 3.3 Realizar inspeção visual local com cartões simultâneos, coluna intermediária e última coluna, confirmando borda de hover, botão simples, foco, contraste, rolagem e ausência de destaque em outras horas; registrar o resultado antes de concluir a change.

## Workflow follow-up

- Implementar somente após revisão dos artefatos e coordenação com a change ativa `ajustar-grade-horaria-e-botao-atual`.
- Arquivar a change apenas depois da implementação, validação estrita e atualização da spec principal.
