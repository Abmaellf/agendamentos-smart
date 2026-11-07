# Design

## Context

Conforme `proposal.md` e o delta de `weekly-appointments`, a agenda atual já consulta e distribui os agendamentos corretamente, mas a apresentação dos cartões ainda usa tokens verdes, laranja e cinza e uma divisão visual de horário diferente da referência. O ponto de renderização ativo está na página da feature `appointments`; os componentes legados em `src/components/Card` não possuem consumidores ativos e não devem ser reativados por esta change.

## Goals / Non-Goals

**Goals:**

- Concentrar a paleta dos cartões em tokens visuais reutilizáveis, preservando a associação com os seis estados tipados.
- Fazer o cartão ativo exibir horário local, paciente, serviço e estado acessível com a hierarquia da referência: fundo forte, borda clara, cantos discretamente arredondados e sombra leve.
- Manter a leitura em colunas estreitas sem depender somente da cor ou de truncamento que esconda a identificação.
- Validar cada estado e a apresentação responsiva por testes da agenda semanal.

**Non-Goals:**

- Alterar a estrutura dos dados, a API, o cálculo de fuso, a ordenação, o cache ou o fluxo de criação.
- Migrar `CardPatient`/`CardDay` legados ou introduzir uma nova regra de negócio baseada na cor.
- Implementar visualizações diária/lista, sobreposição temporal ou ações de mudança de estado.

## Decisions

1. **Usar tokens compartilhados para as quatro famílias cromáticas.**

   Os valores-alvo da referência serão definidos como tokens semânticos de agenda e consumidos pelo mapa de apresentação da página: amarelo `#FFCF2E`, verde `#069B6D`, grafite `#2F3032` e vermelho `#F51F3D`. O mapa manterá todos os estados atuais e aplicará texto preto somente ao amarelo, branco às outras famílias. Isso permite ajustar a tonalidade em um ponto único e mantém a cor como apresentação derivada.

   Alternativas consideradas: manter os tokens atuais por estado, que preservaria a divergência visual; ou colocar hexadecimais diretamente no JSX, que dificultaria a manutenção e a validação de contraste.

2. **Aplicar o mapa na implementação ativa da agenda.**

   A implementação deve alterar a apresentação usada pela rota `/appointments`, preservando o atributo de estado e a informação textual acessível já renderizada. O horário continuará sendo derivado do instante e fuso do agendamento; paciente e serviço continuarão vindo do registro retornado.

   Alternativa considerada: corrigir somente o componente legado `CardPatient`. Isso não alcançaria a tela entregue porque o módulo legado não possui consumidores ativos.

3. **Preservar conteúdo e melhorar a acomodação responsiva.**

   A área de conteúdo deve permitir quebra controlada ou outra acomodação equivalente para que nome e serviço permaneçam identificáveis em colunas estreitas. A cor será acompanhada pelo estado textual acessível, mantendo a leitura para baixa visão e daltonismo.

   Alternativa considerada: manter `truncate` sempre ativo, que conserva a altura do cartão mas pode ocultar justamente os dados necessários para identificar o atendimento.

4. **Validar por comportamento e inspeção visual.**

   Os testes de integração devem cobrir a tabela dos seis estados, o conteúdo completo, o estado acessível e a classe/atributo responsivo observável. A conclusão da implementação também exige uma inspeção visual da agenda comparada à imagem de referência, porque a legenda de status não está explícita na imagem.

## Risks / Trade-offs

- **[Risco]** A imagem não traz legenda de status, então a correspondência cromática pode não refletir a intenção de negócio. → **Mitigação:** registrar e revisar explicitamente a tabela `AGENDADO`/`REAGENDADO` amarelo, `EMATENDIMENTO`/`FINALIZADO` verde, `CANCELADO` grafite e `FALTA` vermelho durante a validação visual antes do archive.
- **[Risco]** Cores fortes podem reduzir contraste ou perder legibilidade em temas diferentes. → **Mitigação:** manter texto preto no amarelo, branco nas demais famílias e executar verificação de acessibilidade/inspeção em viewport estreita.
- **[Risco]** Ajustes de quebra de texto podem aumentar a altura de cartões e alterar a densidade da semana. → **Mitigação:** manter padding e tipografia compactos da referência e verificar a agenda com nomes longos e serviço longo.

## Migration Plan

Não há migração de dados nem alteração de contrato. A entrega é reversível por rollback dos arquivos de apresentação e dos testes correspondentes; após a implementação, executar os testes direcionados, lint, build e `openspec validate ajustar-card-agendamento-cores --strict` antes do archive.
