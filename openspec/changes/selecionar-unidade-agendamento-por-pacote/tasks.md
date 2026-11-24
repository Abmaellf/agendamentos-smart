# Tasks

## 1. Contrato e modelos de unidade

- [ ] 1.1 Alinhar com a API irmã o contrato de prévia e confirmação para aceitar `unitId`, validar a unidade efetiva por papel e rejeitar combinações incompatíveis; verificar com testes de contrato os casos autorizado, unidade externa e unidade BASIC divergente.
- [x] 1.2 Atualizar os tipos e adaptadores do frontend para transportar `unitId` no input de pacote e filtrar o catálogo de pacotes pela unidade efetiva; verificar com teste de request os parâmetros e o corpo enviados.
- [x] 1.3 Garantir que o catálogo de pacientes usado pelo fluxo de pacote aceite `unitId` e mantenha a mesma semântica do agendamento manual; verificar com handler/teste MSW que nenhuma consulta ocorre sem unidade e que a query contém o identificador correto.

## 2. Fluxo de seleção e estado dependente

- [x] 2.1 Implementar a unidade efetiva no diálogo: select editável para `ADMIN`, unidade `activeUnitId` bloqueada para `BASIC` e estado de erro quando a unidade BASIC não estiver disponível; verificar os estados com teste de integração por papel.
- [x] 2.2 Tornar pacientes e pacotes dependentes da unidade efetiva, incluindo carregamento, vazio, erro e bloqueio enquanto a unidade não estiver definida; verificar que somente registros da unidade selecionada aparecem.
- [x] 2.3 Ao trocar a unidade, limpar paciente, pacote, dias efetivos e prévia, evitando confirmação com estado anterior; verificar com teste de integração a troca entre duas unidades e a recarga dos catálogos.
- [x] 2.4 Enviar a unidade efetiva na prévia e na confirmação e invalidar a prévia quando unidade, paciente ou pacote mudar; verificar o payload, a ausência de confirmação sem prévia válida e o tratamento de resposta incompatível.
- [x] 2.5 Atualizar o README da feature de pacotes com o escopo por unidade, comportamento de `ADMIN`/`BASIC` e dependência do backend; verificar que a documentação não descreve filtragem no frontend como autorização.

## 3. Verificação integrada

- [x] 3.1 Executar os testes direcionados do fluxo de pacote e do agendamento manual, confirmando que a nova regra não altera o contrato manual; registrar falhas preexistentes ou bloqueios de API irmã.
- [x] 3.2 Executar `npm run lint` e `npm run build`, registrando o resultado e distinguindo falhas desta change das incompatibilidades legadas conhecidas.
- [x] 3.3 Executar `openspec validate selecionar-unidade-agendamento-por-pacote --strict` e corrigir qualquer inconsistência dos artefatos antes da revisão.

## Workflow follow-up

- Implementar esta change somente após a capability de contratação por pacote e o vínculo usuário-unidade estarem disponíveis e validados.
- Atualizar as caixas de seleção com evidência real durante a implementação; arquivar a change somente após revisão e validação concluídas.
