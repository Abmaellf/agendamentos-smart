# Tasks

## 1. Modelo da matriz horária

- [x] 1.1 Criar a representação derivada da semana com cinco dias úteis, janela visual de `07:00` a `18:00`, linhas de 60 minutos e conversão de `startsAt`/`durationMinutes` no fuso do agendamento; verificar com testes unitários de horário normal, minuto intermediário, virada de dia e fuso diferente do navegador.
- [x] 1.2 Implementar a distribuição determinística de intervalos sobrepostos em faixas laterais, mantendo cada paciente em um card separado e sem ocultação de conteúdo; verificar com fixture de dois, três e múltiplos agendamentos simultâneos.

## 2. Grade semanal e cabeçalhos

- [x] 2.1 Substituir a lista vertical por uma matriz com régua lateral de `07:00` até `18:00`, linhas horizontais atravessando as colunas e cinco colunas na ordem Segunda, Terça, Quarta, Quinta e Sexta; verificar a presença das linhas, colunas e horários no teste da página.
- [x] 2.2 Renderizar em cada coluna o nome do dia, a data no formato `24 de Agosto`, o indicador de calendário e o destaque textual/visual `Hoje` para a data atual; verificar a ordem, a formatação pt-BR e a seleção sem nova chamada HTTP.
- [x] 2.3 Posicionar os cards conforme o início e a duração, incluindo cards que atravessam várias linhas e atendimentos que começam antes ou terminam depois da janela visível; verificar geometria/atributos de posição nos testes de integração.

## 3. Cards, cores e legenda

- [x] 3.1 Ajustar o card para exibir paciente e serviço dentro da faixa temporal, manter o estado acessível e aplicar amarelo, verde, grafite ou vermelho conforme a tabela dos seis estados; verificar conteúdo, contraste e todos os estados no teste da agenda.
- [x] 3.2 Adicionar a legenda inferior com “Aguardando atendimento / Paciente agendado”, “Atendida / Atendimento realizado”, “Cancelado / Agendamento cancelado” e “Falta / Paciente não compareceu”; verificar que cada item possui texto acessível e corresponde à cor dos cards.
- [x] 3.3 Preservar carregamento, erro, vazio, consulta semanal, criação manual, ordenação por dia/fuso e dados do paciente/serviço; verificar os cenários existentes de integração sem alterar endpoints ou payloads.

## 4. Responsividade e qualidade visual

- [x] 4.1 Garantir rolagem horizontal controlada em viewport estreita sem perder a régua, os cabeçalhos, os cards ou a legenda, mantendo nomes e serviços identificáveis; verificar com teste responsivo e inspeção visual.
- [x] 4.2 Comparar a agenda renderizada com a imagem de referência em casos normais, sobrepostos, nomes longos, dia atual e cards fora da janela 07:00–18:00; registrar qualquer desvio antes da conclusão.

  Registro: a estrutura da matriz, os casos sobrepostos, nomes longos, “Hoje”, paleta e cards fora da janela foram verificados pelos testes DOM direcionados. A captura headless confirmou o shell visual claro, mas a API externa não respondeu no navegador local; por isso não foi possível obter uma captura populada confiável sem alterar o ambiente da aplicação.

## 5. Verificação final

- [x] 5.1 Executar `npm run test -- src/features/appointments/__tests__/appointments-page.integration.test.tsx` e os testes unitários do modelo de posicionamento; registrar o resultado.
- [x] 5.2 Executar `npm run lint` e corrigir problemas introduzidos pela matriz, pelos helpers ou pelos testes.
- [x] 5.3 Executar `npm run build`; registrar separadamente os três erros TypeScript legados já conhecidos em `src/components/Card/CardDay/index.tsx` e `src/components/__tests__/legacy-calendar-components.test.tsx`, caso permaneçam.
- [x] 5.4 Executar `openspec validate implementar-grade-horaria-agenda-semanal --strict` e confirmar que todos os cenários e artefatos estão válidos.

  Resultado das verificações: 24 testes direcionados passaram; `npm run lint` passou; `npm run build` permanece bloqueado somente pelos três erros TypeScript legados descritos no item 5.3.

## Workflow follow-up

- Após a implementação, revisão visual e validação, executar `openspec archive implementar-grade-horaria-agenda-semanal --yes`.
- Verificar a spec promovida e o status da change após o archive.
