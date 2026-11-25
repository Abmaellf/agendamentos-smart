# Feature `packages`

## Objetivo

Permitir que administradores mantenham as definições comerciais de pacotes por
unidade: serviço, sessões, valor total, dias da semana e situação.

## Fluxo atual

`/services/packages` consulta sessão, catálogos de unidade/serviço e
`/api/service-packages`. A página oferece filtros, listagem mestre em tabela,
paginação em um container responsivo amplo, detalhe em modal, criação/edição em
modal e ativação/desativação. As mutations invalidam a tag RTK Query `ServicePackage`,
mantendo a lista atualizada.

Os dias aceitos são `SUNDAY` a `SATURDAY`; a frequência exibida vem do backend
e é derivada do conjunto de dias. O valor é enviado como decimal textual no
formato `0.00`. A interface melhora a experiência de preenchimento, mas o
servidor é a autoridade para papel ADMIN, clínica, unidade, serviço, preço e
imutabilidade.

## Contratos

| Operação         | Endpoint                                  |
| ---------------- | ----------------------------------------- |
| Listar e filtrar | `GET /api/service-packages`               |
| Detalhar         | `GET /api/service-packages/{id}`          |
| Criar            | `POST /api/service-packages`              |
| Editar           | `PATCH /api/service-packages/{id}`        |
| Alterar situação | `PATCH /api/service-packages/{id}/status` |

Não existe exclusão física. Um pacote inativo permanece visível no histórico
administrativo e não pode ser usado em novas contratações.

## Consulta paginada

O contrato esperado pela listagem é uma resposta com `content`, `page`, `size`,
`totalElements`, `totalPages` e `last`. A API irmã atualmente retorna apenas o
envelope legado `{ content }` em `GET /api/service-packages`; o adaptador do
frontend aceita as duas formas e trata o envelope legado como uma única página.
Isso mantém o fluxo compatível durante a transição, mas não cria paginação real
no cliente. A paginação server-side só estará plenamente disponível quando o
backend passar a aplicar `page`/`size` e retornar os metadados.

## Componentes e estados da listagem

`PackagesPage` orquestra filtros aplicados, página, seleção, detalhe modal e
modo do modal de criação/edição. Em telas amplas, a listagem usa um container
mais largo; em telas estreitas, o overflow horizontal fica restrito à tabela.
A apresentação foi dividida em componentes da própria feature:

- `PackageTableFilter`: rascunho e aplicação/limpeza dos filtros;
- `PackageTable`: tabela mestre, seleção e ações administrativas;
- `PackagePagination`: navegação baseada nos metadados da página;
- `PackageDetailPanel`: detalhe do pacote em diálogo modal responsivo, com foco
  acessível e ações administrativas;
- `PackageFormModal`: criação e edição no mesmo formulário modal.

A tela comunica carregamento inicial e atualização, erro com tentativa
novamente, estado vazio, seleção ativa e ações nomeadas. A gestão continua
restrita ao papel `ADMIN`; o frontend apenas apresenta a autorização e a API
permanece a autoridade para escopo, validação e imutabilidade.

## Agendamento por pacote

O botão global `Agendamento de Pacotes` abre o mesmo contexto de agendamento,
com unidade, paciente, pacote, data inicial e horário manual. Para `ADMIN`, a
unidade é escolhida entre as unidades autorizadas da clínica; para `BASIC`, ela
é fixada em `activeUnitId` da sessão. Pacientes e pacotes só são consultados
depois que a unidade efetiva estiver definida e são filtrados por ela. Os dias
do pacote são pré-preenchidos, mas podem ser ajustados apenas para a
contratação. A prévia chama `POST /api/package-appointments/preview` sem
reservar sessões e envia `unitId`; a confirmação chama
`POST /api/package-appointments/confirm` com `unitId`, fingerprint e
`Idempotency-Key`.

O frontend usa esses filtros para orientar a seleção, mas a API permanece a
autoridade para validar clínica, unidade, paciente, pacote e permissões. A
validação correspondente no backend é uma dependência da API irmã e não está
presente neste checkout.

O backend gera exatamente a quantidade de sessões percorrendo os dias efetivos
no fuso da unidade, reutiliza as regras do agendamento manual e grava uma
contratação com snapshot imutável. Feriados, funcionamento e bloqueios de
calendário não são consultados nesta etapa e ficam para uma especificação
futura.

## Limites da gestão administrativa

O cadastro administrativo não seleciona paciente nem cria agendamentos. A
contratação é iniciada pelo topbar e não altera a definição administrativa do
pacote.

## Verificação desta implementação

Em 2026-11-14 foram aprovados `npm run lint` e os testes Vitest da página,
schema, topbar e sidebar (24 cenários). `npm run build` alcança a checagem dos
arquivos desta feature sem erro próprio, mas permanece bloqueado por três
fixtures legadas incompatíveis com o tipo atual de `Appointment` em
`CardDay/index.tsx` e `legacy-calendar-components.test.tsx`. Esses arquivos
não foram modificados por esta feature.
