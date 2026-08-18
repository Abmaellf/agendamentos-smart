# Componentes locais de pacientes

## Objetivo do módulo

Concentrar componentes usados apenas pela página de pacientes.

## Responsabilidades e funcionalidades existentes

- `create-patient-dialog.tsx`: formulário de nome e criação via contexto;
- `patient-table-filter.tsx`: formulário de busca que refaz a listagem;
- `patient-table-rows.tsx`: linha visual da tabela.

## Dependências internas e externas

- internas: `components/ui` e `PatientContext`;
- externas: React Hook Form, Zod, resolvers, use-context-selector e Lucide;
- módulo relacionado: `page/patient/index.tsx`.

## Pontos de entrada e fluxos de entrada

Todos entram por `Patient`. O diálogo e o filtro selecionam operações do contexto; a linha recebe um objeto contendo apenas `name` em seu tipo local.

## Arquivos críticos

Os três arquivos participam da rota `/paciente`; o diálogo compete com o modal compartilhado por responsabilidade de criação.

## Regras próprias do módulo

- Deve existir um único formulário local/canônico com nome, CPF e telefone e schema compartilhado com o contrato de API.
- Filtro deve encaminhar critérios reais ao adaptador e paginação deve refletir metadados reais da resposta.
- Linhas devem receber o tipo canônico de paciente e nunca completar código, data ou status com valores fixos.
- Componentes não acessam Axios/contexto de agenda para persistir; usam hooks de paciente baseados em React Query.
- A interface não deve adicionar campos clínicos ou prontuário ao primeiro MVP.
- Ações e logs devem minimizar a exposição de CPF e telefone.

## Observações técnicas e débitos

- Schema de nome permite string vazia no diálogo local.
- O filtro não encaminha o valor informado à API.
- A linha imprime o paciente no console e usa valores fixos para código/data/status.
- O contrato local da linha é mais estreito que o tipo de paciente mantido pelo contexto.
