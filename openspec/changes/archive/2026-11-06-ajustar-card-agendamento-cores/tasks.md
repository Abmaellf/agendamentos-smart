# Tasks

## 1. Paleta e mapeamento de estados

- [x] 1.1 Atualizar os tokens semânticos de agenda para amarelo `#FFCF2E`, verde `#069B6D`, grafite `#2F3032` e vermelho `#F51F3D`, mantendo os tokens disponíveis para a implementação ativa; verificar que os valores estão definidos em um único ponto e que `npm run lint` continua passando. Verificado: `npm run lint` aprovado.
- [x] 1.2 Ajustar o mapa de apresentação da agenda para `AGENDADO`/`REAGENDADO` amarelo, `EMATENDIMENTO`/`FINALIZADO` verde, `CANCELADO` grafite e `FALTA` vermelho, com texto preto somente no amarelo; verificar a tabela com o teste direcionado de `appointments-page.integration.test.tsx`. Verificado: 18 testes aprovados.

## 2. Cartão completo e responsividade

- [x] 2.1 Ajustar a marcação visual do cartão ativo para preservar horário local, paciente, serviço e estado acessível, com fundo forte, borda clara, cantos discretamente arredondados e sombra leve; verificar os dados renderizados no teste de integração da agenda. Verificado: suíte direcionada aprovada.
- [x] 2.2 Garantir acomodação de nomes e serviços longos em coluna diária e viewport estreita, sem ocultar a identificação do atendimento e sem depender apenas da cor; adicionar/ajustar teste responsivo e verificar com `npm run test -- src/features/appointments/__tests__/appointments-page.integration.test.tsx`. Verificado: cenário de conteúdo longo e suíte direcionada aprovados.
- [x] 2.3 Manter a consulta, o cálculo de fuso, a ordenação e o atributo de estado sem alteração; verificar que os cenários existentes de semana, fuso e criação continuam passando no teste de integração direcionado. Verificado: 18 testes aprovados.

## 3. Verificação da entrega

- [x] 3.1 Executar `npm run lint` e corrigir eventuais problemas introduzidos pelos estilos ou testes; registrar o resultado na conclusão da tarefa. Verificado: `npm run lint` aprovado.
- [x] 3.2 Executar `npm run build` e confirmar que a aplicação compila com os tokens e o cartão atualizados; registrar falhas preexistentes separadamente se ocorrerem. Verificado: falhou nos três erros TypeScript preexistentes de `src/components/Card/CardDay/index.tsx` e `src/components/__tests__/legacy-calendar-components.test.tsx`, fora do escopo desta change.
- [x] 3.3 Executar `openspec validate ajustar-card-agendamento-cores --strict` e confirmar que todos os artefatos e cenários da change estão válidos. Verificado: change válida.
- [ ] 3.4 Fazer inspeção visual da agenda comparando os quatro grupos cromáticos e o cartão completo com a imagem de referência; confirmar especialmente contraste, nomes longos e viewport estreita.

## Workflow follow-up

- Após a implementação, revisão e validação, executar `openspec archive ajustar-card-agendamento-cores --yes`.
- Verificar a spec promovida e o status da change após o archive.
