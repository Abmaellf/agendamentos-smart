# Tasks

## 1. Contrato e contexto temporal

- [x] 1.1 Adicionar tipos do request/response e mutação RTK Query para `POST /api/appointments/start-current-hour`; verificar com MSW uma única chamada contendo somente `unitId`/`hourStart` e correspondência dos campos/contagens com o design da API irmã.
- [ ] 1.2 Resolver unidade/fuso pelo catálogo autorizado e criar modelo temporal da ação; verificar com testes de relógio controlado 07:00, 08:30, 08:59:59, 09:00, meia-noite, navegador em outro fuso, offset repetido e contexto inválido.
- [ ] 1.3 Conectar atualização na virada e retorno à aba, fechando a opção em mudança de unidade/semana/faixa; verificar com testes de timers, visibilidade e desmontagem que a célula antiga não permite envio.
- [x] 1.4 Documentar no README da feature o novo endpoint, a origem do fuso e a confirmação de presença que inclui faltas; conferir o texto contra os dois deltas e identificar o que ainda não estiver implementado.

## 2. Controle flutuante da célula

- [ ] 2.1 Criar e integrar o botão verde com “+” branco na célula temporal de `AppointmentsPage`, usando as alturas reais da grade; verificar casos de semana diferente, hora fora da grade, célula vazia e cartões em múltiplas linhas nos testes de apresentação.
- [ ] 2.2 Implementar a opção `Iniciar todos` acima do botão, contexto unidade/data/faixa e indicação de presença inclusive para faltas; verificar clique/toque, Enter/Espaço, Tab, Escape, clique externo, retorno de foco e ausência de propagação para o cartão.
- [ ] 2.3 Manter a grade atual acessível no estado vazio e a ação desabilitada sem elegíveis, em carregamento ou erro; verificar os cenários em testes de integração e documentar esses estados no README da feature.
- [ ] 2.4 Verificar visualmente a posição com a imagem de referência em desktop e viewport estreita, primeira linha e rolagem; registrar evidência de botão dentro da célula, opção acima, alvo de toque e cartões sem obstrução.

## 3. Execução e feedback

- [x] 3.1 Conectar a opção à mutação com bloqueio de duplo envio e `Iniciando...`; verificar em integração que abrir “+” não modifica dados, `AGENDADO`/`FALTA` habilitam a ação e não há atualização otimista.
- [ ] 3.2 Apresentar contagens de sucesso/zero, fechar a opção e atualizar a consulta; verificar resultado misto, resposta tardia após troca de contexto e falha do GET após POST confirmado, sem reaplicar a operação.
- [ ] 3.3 Tratar faixa expirada, conflito de reativação, contexto inválido, sessão/escopo e rede/timeout; verificar MSW para 400/401/403/404/409/422/5xx e que nenhuma falha provoca chamadas individuais, troca de unidade/faixa ou repetição automática.
- [ ] 3.4 Completar documentação de feedback e limites do novo fluxo; revisar que o modal individual e o monitor permanecem com suas regras, e executar a regressão de detalhes e criação manual.

## 4. Verificação integrada

- [x] 4.1 Executar `npm run test -- src/features/appointments/__tests__`, `npm run lint` e `npm run build`; registrar resultados e separar falhas preexistentes de regressões desta change.
- [ ] 4.2 Com a API irmã implementada e dados sintéticos descartáveis, verificar início de `AGENDADO`/`FALTA`, preservação dos demais estados, repetição, hora expirada e isolamento de unidade/clínica; registrar evidência do fluxo sem dados pessoais.
- [ ] 4.3 Revisar contrato, documentação, tarefas e cenários nas duas changes e executar `openspec validate iniciar-agendamentos-da-hora-atual-em-lote --strict`; confirmar que cada requisito possui evidência ou bloqueio registrado.

## Workflow follow-up

- A aplicação foi iniciada: tarefas marcadas refletem implementação e evidência
  executadas; as demais continuam pendentes até cobertura visual, de timers,
  erros e integração com a API real.
- Disponibilizar a API antes de habilitar a ação no frontend; deploy e outras ações sujeitas a confirmação seguem o protocolo do repositório.
- Sincronizar/arquivar somente após implementação concluída, verificações registradas e validação estrita; preservar as demais changes em curso.
