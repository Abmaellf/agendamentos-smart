# Feature `packages`

## Objetivo

Permitir que administradores mantenham as definições comerciais de pacotes por
unidade: serviço, sessões, valor total, dias da semana e situação.

## Fluxo atual

`/services/packages` consulta sessão, catálogos de unidade/serviço e
`/api/service-packages`. A página oferece filtros, criação, detalhe/edição por
card e ativação/desativação. As mutations invalidam a tag RTK Query
`ServicePackage`, mantendo a lista atualizada.

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

## Agendamento por pacote

O botão global `Agendamento de Pacotes` abre o mesmo contexto de agendamento,
com paciente, pacote, data inicial e horário manual. Os dias do pacote são
pré-preenchidos, mas podem ser ajustados apenas para a contratação. A prévia
chama `POST /api/package-appointments/preview` sem reservar sessões; a
confirmação chama `POST /api/package-appointments/confirm` com fingerprint e
`Idempotency-Key`.

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
