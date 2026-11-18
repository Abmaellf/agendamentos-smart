# Proposal

## Why

A listagem atual de pacientes ainda é uma tabela legada, com dados fixos, ações sem operação de domínio e pouca hierarquia visual, enquanto a referência desejada apresenta uma experiência mais clara, colorida e orientada à clínica. O cadastro também está desalinhado do contrato atual da API: a interface envia somente `name`, não informa `unitIds`, mantém um segundo fluxo para o endpoint legado `POST patients` e, para a conta de recepção (`USER`/`BASIC`), o endpoint `/patient/save` está protegido somente para `ADMIN`.

## What Changes

- Evoluir a rota `/paciente` para a listagem visual de referência: cabeçalho da página, ação destacada de novo paciente, filtros em campos separados, tabela/card com identidade visual verde, avatares por iniciais, chips de status, data de cadastro, ações e paginação real.
- Remover dados apresentados como se fossem reais quando hoje são fixos no frontend, incluindo código, data, status e total da paginação; a tela deverá usar os campos disponíveis no contrato da API ou comunicar explicitamente a ausência.
- Escolher `POST /patient/save` como contrato único de criação e retirar o fluxo legado `POST patients` do caminho executável da tela.
- Alinhar o payload ao contrato do backend, exigindo `unitIds` não vazio e garantindo que a unidade esteja no escopo da clínica autenticada. Para `BASIC`/`USER`, a unidade deverá ser a `activeUnitId` da sessão; `ADMIN` poderá escolher unidades autorizadas da própria clínica conforme o contrato aprovado.
- Ajustar a autorização do cadastro para refletir a regra de negócio documentada de que `ADMIN` e `BASIC` podem cadastrar pacientes, sem permitir que o cliente escolha uma clínica ou unidade de outra clínica.
- Expor erros de validação, autorização, unidade inválida e paciente duplicado em mensagens acionáveis na interface.
- Manter edição, inativação, detalhe e status de atendimento fora do escopo de domínio desta change quando não houver contrato HTTP correspondente; os controles visuais só poderão ser interativos quando houver operação implementada.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `legacy-patient-management`: substituir a listagem e os dois fluxos legados de cadastro por uma experiência única, paginada e alinhada ao vínculo obrigatório entre paciente, clínica e unidade.

## Impact

- Frontend: `src/features/patients`, tipos de paciente, sessão, catálogos de unidade, layout visual e testes de integração da rota `/paciente`.
- API: `PatientController`, `PatientService`, `PatientRequestDTO`, `PatientResponseDTO`, repositório/testes de paciente e a regra de autorização de `POST /patient/save`.
- Contrato HTTP: o cadastro passa a exigir `unitIds`; a resposta de listagem precisará fornecer os dados que a interface realmente exibir, como código, data, status e, se aprovado pelo domínio, serviço principal.
- Dados e segurança: a clínica será derivada da identidade autenticada; unidades serão validadas dentro da mesma clínica e o isolamento continuará sendo responsabilidade do backend.
- Dependência: a sessão deve fornecer `activeUnitId` válido para `BASIC`; a change ativa `relacionar-usuarios-unidades-clinicas` já define essa associação e deve ser considerada antes da implementação integrada.
- Fora de escopo: criação de novas clínicas/unidades, seletor de unidade para `BASIC`, prontuário, edição/inativação de paciente, regra definitiva de status “Em atendimento” e deploy/migração destrutiva.
