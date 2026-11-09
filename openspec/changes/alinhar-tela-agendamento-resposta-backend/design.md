# Design

## Context

Consulte `proposal.md` para a motivação. A API de consulta já usa `/api/appointments` com `unitId`, `from` e `to` e retorna um envelope `content`; a transformação atual extrai esse envelope. O modelo compartilhado da feature, porém, foi definido a partir de um contrato anterior e não contempla todos os campos observados no retorno informado. A grade ativa calcula o dia e horário a partir de `startsAt` e `timeZone`.

## Goals / Non-Goals

**Goals:**

- Tornar o modelo de leitura compatível com o payload de referência, incluindo `createdBy` e os metadados auxiliares.
- Manter a transformação do envelope e a renderização da agenda estáveis quando `professional` for nulo e `price` vier como número.
- Separar claramente o contrato de resposta do contrato mínimo de criação.
- Reproduzir o retorno de referência em builders/handlers e cobrir o fluxo da tela com testes observáveis.

**Non-Goals:**

- Alterar URL, parâmetros de consulta, cache, posicionamento por fuso ou regras de layout.
- Exibir todos os metadados auxiliares no cartão se eles não forem necessários para a experiência atual.
- Alterar o payload ou as permissões da criação manual.

## Decisions

1. **Modelar a resposta de leitura como contrato próprio.**

   O tipo usado pela coleção de agendamentos deve refletir o nome e a nulabilidade dos campos da resposta. `createdBy` será mantido como campo de resposta; o payload de criação continuará usando somente seus campos de entrada. A alternativa de manter um alias obrigatório `createdByUserId` esconderia a divergência e continuaria incompatível com o JSON real.

2. **Preservar os campos extras sem acoplá-los ao layout.**

   `patientId`, `pathology`, `appointmentDate`, `hours`, `variant` e `updatedAt` serão parte do registro de leitura, enquanto a página continuará usando `startsAt`, `timeZone`, `durationMinutes`, paciente, serviço e status para a grade. Isso permite que a resposta seja preservada sem obrigar a tela a inventar uma apresentação para cada metadado.

3. **Normalizar apenas na borda do transporte quando necessário.**

   A transformação de `content` deve aceitar o envelope informado e manter os valores semânticos do backend. Formatação monetária e visualização de horário pertencem à apresentação; não haverá mutação do payload nem reinterpretação de `appointmentDate`/`hours` no lugar do instante ISO.

4. **Usar um fixture fiel ao retorno fornecido.**

   Os testes devem incluir pelo menos os três registros da amostra, cobrindo `professional: null`, profissional preenchido, timezone `America/Cuiaba`, estados e horários distintos. Isso valida o contrato real e reduz a dependência de fixtures antigos que não possuem `patient`/`service` completos.

## Risks / Trade-offs

- **[Risco]** O backend pode evoluir campos ou tipos além da amostra → **Mitigação:** testar os campos normativos observados e manter a leitura estritamente baseada nos campos necessários, sem usar campos auxiliares como fonte de posicionamento.
- **[Risco]** Trocar `createdByUserId` por `createdBy` pode afetar consumidores antigos → **Mitigação:** localizar referências antes da implementação e ajustar somente consumidores do contrato de leitura; preservar o contrato de criação e validar build/testes.
- **[Risco]** Preço numérico e preço textual podem coexistir entre endpoints → **Mitigação:** definir a resposta de leitura como `number` conforme o payload de referência e fazer a formatação somente na UI, sem reutilizar esse tipo como entrada de criação.

## Migration Plan

Não há migração de dados nem mudança de endpoint. Implementar o tipo/fixture/testes, verificar lint, testes direcionados e build; em caso de rollback, reverter os artefatos de contrato de leitura e os testes, mantendo a criação manual inalterada.
