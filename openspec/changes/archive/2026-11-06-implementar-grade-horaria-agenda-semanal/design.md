# Design

## Context

Consulte `proposal.md` e o delta de `weekly-appointments` para o objetivo e o contrato visual. Hoje a página agrupa os agendamentos por dia, ordena por `startsAt` e renderiza uma lista vertical; o contrato `Appointment` já fornece `startsAt`, `timeZone`, `durationMinutes`, paciente, serviço e estado, portanto a mudança pode ser feita como composição visual derivada sem novo endpoint.

## Goals / Non-Goals

**Goals:**

- Derivar uma representação de matriz para cinco dias úteis, com janela padrão de 07:00 a 18:00 e linhas de uma hora.
- Posicionar cards por minuto inicial e duração, incluindo uma distribuição determinística de cards que se sobrepõem.
- Reproduzir a hierarquia visual da referência: cabeçalhos de dia/data, grade clara, destaque do dia atual, cards coloridos e legenda inferior.
- Preservar o fluxo de consulta, o cálculo por fuso, a criação manual, os estados de feedback e a acessibilidade dos dados.

**Non-Goals:**

- Alterar a API, os modelos persistidos, a regra de conflito/capacidade ou a autorização do backend.
- Criar edição, cancelamento, remarcação ou novas visualizações funcionais de dia/lista.
- Reativar `CardDay`/`CardPatient` legados ou corrigir seus fixtures TypeScript fora do escopo visual desta change.

## Decisions

1. **Usar uma janela horária derivada e uma régua compartilhada.**

   A grade terá uma coluna fixa para os horários `07:00`–`18:00` e cinco colunas de dia. Cada linha representa 60 minutos e atravessa visualmente as colunas. A altura de uma hora será um token de layout ajustável para manter a referência visual sem transformar pixels em regra de domínio.

   Alternativa considerada: continuar com uma lista independente por dia; ela não permite alinhamento horizontal entre dias nem comunica lacunas e simultaneidade.

2. **Calcular posição no fuso do agendamento.**

   Para cada registro, a implementação deve obter a data e os minutos locais no `timeZone` do próprio agendamento, calcular o deslocamento desde 07:00 e converter `durationMinutes` em altura. O agrupamento por dia deve usar a mesma data local usada para a posição, evitando que um instante UTC atravesse a coluna errada.

   Alternativa considerada: usar diretamente `Date#getHours()` no fuso do navegador; isso quebraria unidades com fuso diferente do navegador da pessoa.

3. **Distribuir intervalos sobrepostos em faixas laterais.**

   Dentro de cada dia, os intervalos serão ordenados por início, duração e id estável. Um algoritmo de faixas atribuirá cada card à primeira faixa livre e usará a quantidade máxima de faixas simultâneas para calcular a largura relativa, preservando a posição lateral durante toda a sobreposição. Cards continuam sendo registros individuais.

   Alternativa considerada: usar somente a ordem de início e largura total; isso faria cards simultâneos se cobrirem ou esconderem dados.

4. **Separar cabeçalho, matriz e legenda.**

   O cabeçalho de cada dia mostrará nome, data e indicador de calendário; a coluna atual terá destaque e “Hoje”. A matriz terá a régua e os cards. A legenda inferior usará quatro itens textuais, mantendo as descrições fornecidas pela referência e uma ação de opções de visualização se ela permanecer no layout aprovado.

   Alternativa considerada: manter o menu segmentado no topo como única indicação de visualização; ele não substitui a legenda de estados nem corresponde à posição apresentada na referência.

5. **Manter status visual sem depender da cor.**

   O mapa atual será mantido em quatro famílias: `AGENDADO`/`REAGENDADO` amarelo, `EMATENDIMENTO`/`FINALIZADO` verde, `CANCELADO` grafite e `FALTA` vermelho. Cada card e cada item da legenda terá rótulo textual ou acessível correspondente.

## Risks / Trade-offs

- **[Risco]** Agendamentos que começam antes de 07:00 ou terminam depois de 18:00 podem ultrapassar a janela visual. → **Mitigação:** manter o card renderizado, permitir overflow controlado e preservar seu conteúdo; a janela é visual, não um filtro de dados.
- **[Risco]** Conversões de fuso podem deslocar cards para outro dia. → **Mitigação:** calcular agrupamento, início e duração no mesmo IANA `timeZone` e cobrir virada de dia em teste.
- **[Risco]** Muitos intervalos simultâneos podem deixar cards estreitos. → **Mitigação:** calcular faixas máximas, permitir rolagem horizontal da matriz e manter nomes/serviços quebráveis.
- **[Risco]** A legenda usa rótulos de negócio agregados enquanto o modelo possui seis estados. → **Mitigação:** manter a tabela de associação explícita nos testes e preservar o estado canônico em texto acessível.
- **[Risco]** O build possui falhas TypeScript preexistentes nos componentes legados. → **Mitigação:** executar build e registrar essas falhas separadamente, sem ampliar a change para corrigi-las.

## Migration Plan

Não há migração de dados, mudança de endpoint ou alteração de payload. A entrega é reversível pelo rollback da composição da página, dos helpers de posicionamento e dos testes. Antes do archive, executar os testes direcionados, lint, build, validação OpenSpec estrita e inspeção visual com casos normais, longos, simultâneos e fora da janela padrão.
