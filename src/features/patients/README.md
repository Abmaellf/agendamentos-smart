# Feature `patients`

## Objetivo

Concentrar a listagem, filtro, criação legada e apresentação inicial de
pacientes. A rota pública da feature permanece `/paciente` durante a
refatoração.

## Estrutura

```text
patients/
├── api/          # adaptadores HTTP de pacientes
├── components/   # tabela, filtro, diálogos e paginação da feature
├── model/        # PatientContext legado mantido dentro do domínio
├── pages/        # composição da rota /paciente
├── __tests__/    # integração da lista, filtro e criação
└── README.md
```

## Fluxos existentes

- montagem da tela → `GET patient/list` → `PatientContext` → tabela;
- filtro → valida o nome → repete `GET patient/list` sem filtro remoto;
- cadastro pelo modal → `POST /patient/save` via RTK Query;
- cadastro pelo diálogo local → `POST patients` via contexto.

Os dois fluxos de criação permanecem identificáveis nesta change. A
unificação, a escolha do contrato definitivo e a atualização do cache são
escopo de uma change funcional posterior.

## Contratos e dependências

Os contratos compartilhados de paciente e dos formulários da feature ficam em
`src/@types/patient.ts`. A feature usa componentes visuais de
`src/components/ui` e clientes HTTP compartilhados de `src/lib`, mas não move
regras de pacientes para componentes globais.

## Lacunas preservadas

Busca remota, paginação, edição, detalhes, desativação, estados completos de
carregamento/erro/vazio e a duplicidade dos cadastros ainda não constituem uma
implementação funcional completa. A refatoração não corrige esses débitos.
