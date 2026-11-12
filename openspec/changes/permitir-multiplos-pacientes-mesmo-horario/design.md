# Design

## Context

Consulte `proposal.md` para a motivação e o delta de `weekly-appointments` para o comportamento. A grade semanal já calcula faixas temporais e posiciona agendamentos sobrepostos em colunas paralelas. O formulário envia um agendamento por paciente, enquanto as regras definitivas de conflito e capacidade pertencem à API externa.

## Goals / Non-Goals

**Goals:**

- Preservar o fluxo atual de criação individual e permitir uma nova tentativa para paciente distinto no mesmo intervalo.
- Tornar respostas de capacidade e conflitos compreensíveis sem assumir regras de negócio no cliente.
- Garantir que qualquer quantidade de agendamentos simultâneos aceita pela API seja distribuída visualmente, sem perder a identificação de seus cartões.
- Cobrir o fluxo com fixtures de pelo menos dois pacientes simultâneos e com cenários de aceitação e recusa.

**Non-Goals:**

- Implementar reserva em lote, configurar capacidade, ou deduzir vagas localmente.
- Remover o bloqueio autoritativo de sobreposição do paciente ou do profissional.
- Alterar endpoint, payload de criação, cache global, ou estados canônicos de agendamento.

## Decisions

1. **Manter um `POST` por paciente.**

   A interface reutilizará o contrato de criação individual para cada paciente, inclusive quando o horário já contém outro agendamento. Isso preserva a auditoria e permite que o backend decida atomica e autoritativamente sobre a última vaga. A alternativa de um payload com vários pacientes exigiria um novo contrato não fornecido e ampliaria o escopo para operação em lote.

2. **Usar a resposta da API para capacidade e conflitos.**

   O cliente permitirá a tentativa e exibirá a orientação de erro retornada, sem contagem local de vagas. A alternativa de bloquear com base nos cartões carregados poderia usar dados desatualizados e não protege contra criações concorrentes.

3. **Reutilizar o algoritmo de faixas simultâneas para o layout do protótipo.**

   A grade posicionará cada agendamento confirmado em uma faixa lateral dentro do mesmo intervalo; número e largura das faixas serão derivados dos registros da consulta. A alternativa de empilhar cartões esconderia horários e se afastaria do protótipo, que expõe os participantes lado a lado.

4. **Preservar a legibilidade em densidade elevada.**

   A renderização precisará de texto acessível e de um tratamento responsivo para que nome, serviço e estado continuem identificáveis quando mais de dois cartões dividirem a mesma faixa. A solução visual concreta será validada por testes de acessibilidade e revisão contra o protótipo.

## Risks / Trade-offs

- **[Risco]** A API atual pode ainda rejeitar qualquer sobreposição, mesmo com capacidade configurada → **Mitigação:** validar o contrato de capacidade com o backend antes da entrega e registrar o bloqueio sem criar regra local alternativa.
- **[Risco]** Muitos cartões no mesmo intervalo comprimem o conteúdo → **Mitigação:** testar grupos com múltiplos participantes e garantir nome, serviço e estado acessíveis, com rolagem controlada ou adaptação responsiva se necessária.
- **[Risco]** A change ativa de alinhamento de resposta também altera a agenda semanal → **Mitigação:** implementar após integrar ou reconciliar seus tipos, fixtures e testes para evitar conflitos de delta e de código.

## Migration Plan

Não há migração de dados nem mudança de endpoint. Implementar o tratamento visual e de erros, validar contra uma API que aceite capacidade disponível, executar testes direcionados, lint e build. Em caso de rollback, reverter somente a apresentação e o tratamento de criação desta change; os registros já persistidos permanecem sob gestão da API.
