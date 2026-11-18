# Design

## Context

Consulte `proposal.md` e o delta de `weekly-appointments`. Hoje o diálogo consulta `GET /patient/list` sem parâmetros ao abrir, embora esse endpoint seja paginado, e o catálogo do agendamento não recebe a unidade escolhida. O cadastro de paciente envia `unitIds`. No backend irmão, o catálogo específico de agendamento já existe em `GET /api/patients`, mas ainda retorna todos os pacientes da clínica para `ADMIN` e não aceita a unidade escolhida como filtro.

## Goals / Non-Goals

**Goals:**

- Tornar a unidade o contexto obrigatório do catálogo de pacientes.
- Reutilizar o catálogo próprio de agendamento, com cache separado por unidade.
- Fazer a troca de unidade invalidar a seleção e os dados de pacientes anteriores.
- Preservar o isolamento server-side por clínica, papel e unidade.
- Manter o comportamento já aprovado para `BASIC`, incluindo `activeUnitId` e unidade não editável.

**Non-Goals:**

- Filtrar autorização em memória no frontend.
- Alterar o modelo de paciente, o payload de criação do paciente ou o payload de criação do agendamento.
- Transformar a listagem paginada da tela `/paciente` em catálogo de agendamento.
- Alterar profissionais, serviços, duração, preço ou regras de conflito.

## Decisions

### Usar o endpoint de catálogo do agendamento com `unitId`

O frontend deve consumir o catálogo `/api/patients` para o diálogo e enviar `unitId` quando houver uma unidade selecionada. A API deve validar que a unidade pertence à clínica do `ADMIN` e retornar somente pacientes associados a ela. Para `BASIC`, a API deve continuar derivando e impondo a unidade autorizada, mesmo que um cliente envie outro identificador.

Alternativa rejeitada: continuar usando `/patient/list` e aumentar o `size` para tentar obter todos os pacientes. Esse endpoint é paginado, pertence à tela legada de pacientes e não representa explicitamente o catálogo compacto usado pelo agendamento. Filtrar no navegador também é rejeitado porque a opção atual não transporta os vínculos de unidade e porque dados fora do escopo não devem chegar ao cliente.

### Modelar a dependência na chave da consulta

A consulta de pacientes terá `unitId` como argumento. Enquanto o diálogo estiver fechado ou a unidade estiver vazia, a consulta ficará suspensa. Quando o `ADMIN` selecionar outra unidade, o formulário limpará `patientId` antes de consultar a nova chave; a resposta anterior não poderá permanecer como opção selecionável.

Alternativa rejeitada: carregar pacientes uma única vez e filtrar a lista localmente. Isso não cobre pacientes criados depois da carga, não garante o vínculo da unidade e permite reutilizar opções de outra unidade.

### Renderizar unidade antes de paciente para `ADMIN`

O layout e o fluxo de foco devem apresentar Unidade antes de Paciente. O controle de Paciente continuará visível, mas desabilitado com uma mensagem orientando a seleção de unidade até que o catálogo esteja pronto. Para `BASIC`, a unidade será inicializada pelo `activeUnitId` após o catálogo autorizado ser validado, e a consulta dependente seguirá o mesmo caminho.

Alternativa rejeitada: manter os campos lado a lado e permitir a escolha de paciente antes da unidade. A ordem visual não comunicaria a dependência e reproduziria a combinação inválida mostrada nas referências.

### Invalidar o catálogo após cadastro

O cadastro bem-sucedido continuará invalidando `PatientCatalog/LIST`. Qualquer diálogo de agendamento aberto com uma unidade correspondente deve refazer a consulta da chave daquela unidade; ao reabrir o diálogo, a consulta também deve refletir o paciente recém-criado. O paciente só ficará disponível quando a API confirmar que o `unitId` está em `unitIds`.

### Manter a API como autoridade

O frontend usará o catálogo retornado e o `unitId` para orientar a interação, mas a API continuará responsável por tenant, vínculos de unidade e validação da criação. Se a mutação retornar erro de incompatibilidade, o formulário permanecerá aberto para correção.

## Risks / Trade-offs

- [A API ainda não aceitar `unitId` em `/api/patients`] → tornar o contrato compatível antes da publicação do frontend; manter o fallback somente como bloqueio/erro, nunca como lista ampla sem escopo.
- [Paciente criado na unidade errada] → a listagem da unidade selecionada não o exibirá; a mensagem de vazio deve orientar revisar o vínculo no cadastro.
- [Resposta antiga chegar depois da troca de unidade] → usar a unidade na chave da consulta e limpar a seleção antes da troca; testes devem verificar que opções antigas não reaparecem.
- [Catálogos grandes] → preservar a busca textual local sobre a resposta já escopada; paginação remota de catálogo fica fora desta change.

## Migration Plan

1. Atualizar o contrato da API de catálogo e cobrir `ADMIN` em duas unidades, `BASIC` e unidade de outra clínica.
2. Atualizar o frontend para consultar `/api/patients` por `unitId`, reorganizar os campos e limpar o paciente nas trocas.
3. Atualizar handlers, builders e testes para separar pacientes por unidade e simular cadastro/refetch.
4. Executar testes da API e do frontend, lint, build e validação estrita da change.
5. Publicar a API compatível antes de ativar o frontend dependente do parâmetro.

Rollback: retornar temporariamente ao cliente anterior somente se a API anterior continuar disponível; não remover os vínculos `unitIds` nem relaxar as validações server-side.
