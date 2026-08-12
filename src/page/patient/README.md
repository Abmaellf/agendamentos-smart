# Página de pacientes

## Objetivo do módulo

Listar pacientes e oferecer controles iniciais de busca, criação, paginação e ações por registro.

## Responsabilidades e funcionalidades existentes

- busca pacientes ao montar;
- renderiza uma tabela a partir do estado do `SchedulingContext`;
- aceita nome no filtro, mas apenas refaz a chamada sem parâmetro;
- compõe dois diálogos de criação simultâneos;
- mostra controles visuais de editar, desativar e paginar.

## Dependências internas e externas

- internas: `SchedulingContext`, `components/ui`, `AddPatientModal`, `Pagination` e subpasta `component`;
- externas: React, use-context-selector e Radix Dialog;
- módulos relacionados: `api/register-patient`, `lib/axios` e backend de pacientes.

## Pontos de entrada e fluxos de entrada

- rota `/paciente` → `GET patient/list` → `response.data.content` → contexto → linhas;
- filtro → valida nome → repete `GET patient/list` sem filtro;
- criação A → `AddPatientModal` → `POST /patient/save`;
- criação B → `CreatePatientDialog` → contexto → `POST patients`.

## Arquivos críticos

- `index.tsx`: composição, carregamento e tabela;
- `component/create-patient-dialog.tsx`: criação via contexto;
- `components/AddPatientModal.tsx`: criação via React Query;
- `component/patient-table-rows.tsx`: apresentação de cada registro.

## Regras próprias do módulo

- O cadastro mínimo confirmado contém nome, CPF e telefone; todos devem usar contrato único e validação explícita.
- Pacientes pertencem ao `tenant` e são compartilhados entre suas futuras unidades.
- Administrador e usuário básico podem cadastrar pacientes.
- O MVP limita este domínio a cadastro e uso na agenda; prontuário, diagnóstico, evolução e documentos clínicos ficam fora.
- Busca, paginação, edição e demais ações devem operar sobre dados reais do adaptador de mock/API, sem colunas fixas.
- Após criação ou alteração, a lista e os seletores de agendamento devem receber o dado atualizado pelo mesmo cache remoto.
- Dados pessoais não devem ser registrados no console nem exibidos além do necessário.

## Observações técnicas e débitos

- O diálogo externo do Radix envolve `AddPatientModal`, que já cria seu próprio `Dialog`, produzindo composição aninhada e ambígua.
- A mutation de `/patient/save` não invalida nem atualiza a lista.
- Código, status e data da linha são fixos; apenas o nome vem do paciente.
- A tabela declara mais cabeçalhos do que células efetivas de dados consistentes.
- Totais/página são fixos e botões da paginação não fazem nada.
- Edição, detalhes e desativação não possuem handlers.
- A tela não apresenta estados de carregamento, vazio ou erro.
