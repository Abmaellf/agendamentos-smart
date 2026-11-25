# Feature `appointments`

## Objetivo

Concentrar a entidade `Appointment` e todo o fluxo de consulta, criação e
apresentação da agenda semanal. A feature é o único módulo de agendamentos do
front-end.

## Convenção de nomenclatura

- `Appointment`: singular para uma entidade ou registro individual;
- `appointments`: plural para a feature, coleções, queries e caminhos de rota;
- `AppointmentsPage`: página que apresenta uma coleção de agendamentos;
- `createAppointment`: mutação que cria um registro;
- `useGetAppointmentsQuery`: consulta RTK Query que retorna uma coleção.

O caminho externo de agenda é `/api/appointments` para consulta e criação.

O topbar também expõe “Agendamento de Pacotes”. Nesta SPEC 01 ele é somente
informativo e não chama a API nem cria dados; a contratação, a data inicial e a
geração automática pertencem à SPEC 02. As definições administrativas ficam na
feature irmã `packages` e não alteram o fluxo manual desta feature.

## Estrutura

```text
appointments/
├── api/          # chamadas HTTP tipadas
├── components/   # componentes específicos da feature
├── model/         # schemas, transformações e mensagens de domínio
├── pages/         # composição da rota /appointments
└── __tests__/     # testes unitários e de integração
```

Os contratos TypeScript compartilhados da feature ficam em
`src/@types/appointment.ts`.

## Fluxo principal

`/appointments` → `AppointmentsPage` → hooks RTK Query → endpoints injetados
em `baseApi` → `axiosBaseQuery` → API.

A página consome a data compartilhada pela casca, calcula o intervalo semanal,
apresenta carregamento, erro e estado vazio e distribui os registros nos cinco
dias úteis em uma matriz com régua de 07:00 a 20:00. O `AppTopbar` fornece a navegação temporal e abre o
`CreateAppointmentDialog`, que mantém a mesma implementação de criação e usa
`FormField` e `SearchableSelect` compartilhados para a apresentação acessível
dos controles de catálogo. Para a criação manual, Unidade é o contexto do
catálogo de Paciente: `ADMIN` seleciona a unidade primeiro, o catálogo de
pacientes é consultado com essa unidade e a troca de unidade limpa a seleção
anterior. Paciente, unidade, serviço e profissional podem ser localizados por
trecho do nome no dropdown; essa filtragem ocorre localmente sobre o catálogo
já carregado e não cria chamadas por tecla. O catálogo e o vínculo entre
paciente e unidade continuam sob autoridade da API; o frontend apenas orienta
o fluxo e envia os IDs selecionados.
A unidade do usuário `BASIC` é inicializada a partir de `activeUnitId`, fica
visível porém sem edição e só pode ser enviada quando estiver presente no
catálogo autorizado pela API. `ADMIN` mantém a seleção editável entre as
unidades retornadas. Essa regra visual não substitui o escopo e a autorização
aplicados pelo backend.
A consulta de agenda só inicia após a sessão. O diálogo usa `skip` enquanto
fechado e a mutação de criação invalida
`Appointment/LIST`, fazendo a semana visível ser consultada novamente.

### Iniciar atendimentos da hora corrente

Na célula da data corrente e da hora corrente da unidade, a agenda exibe um
botão flutuante roxo translúcido com `+`, usando `#6F3CFF` e aproximadamente
53 px de diâmetro. Quando houver uma próxima coluna visível, o centro do botão
fica sobre a linha divisória entre o dia atual e o próximo; na última coluna,
ele permanece ancorado à borda interna do dia. A hora é calculada pelo fuso IANA
retornado no catálogo da unidade, e não pelo fuso do navegador; a atualização do
relógio ocorre periodicamente e ao retornar para a aba. O botão abre a opção
`Iniciar todos` acima da célula, sem alterar dados ao ser apenas aberto.

`Iniciar todos` envia uma única chamada `POST
/api/appointments/start-current-hour` com apenas `unitId` e `hourStart` em
ISO-8601. A API irmã é a autoridade para confirmar a presença e transformar
`AGENDADO` e `FALTA` em `ATENDENDO` na faixa semiaberta da hora. Isso inclui
faltas porque a confirmação explícita indica que o paciente está presente no
local. Estados `CANCELADO`, `FINALIZADO` e os demais estados não elegíveis são
preservados e aparecem nas contagens de ignorados.

A opção fica desabilitada sem registros elegíveis ou durante o envio. Sucesso
fecha a opção e atualiza a consulta da semana; falhas de domínio ou rede são
mostradas sem atualização otimista e sem chamadas individuais. `Escape` fecha
a opção e devolve o foco ao botão `+`; a troca da semana, da unidade ou da
faixa corrente também fecha uma opção aberta.

Ao selecionar um cartão da agenda, `AppointmentsPage` abre o modal de detalhes
do paciente. O modal apresenta os dados disponíveis no contrato de
`Appointment`, permite fechar pelo controle, por `Escape` ou pelo overlay e
mantém recursos ainda não entregues desabilitados com a indicação `Em breve`.
Telefone, e-mail, nascimento, sala, observações, cadastro completo, edição e
conclusão permanecem fora do escopo deste incremento.

### Status do atendimento

O modal apresenta os estados com o seguinte mapeamento:

- `AGENDADO`: `Aguardando atendimento`;
- `ATENDENDO`: `Atendimento iniciado`;
- `CANCELADO`: `Cancelado`;
- `FALTA`: `Falta`;
- `FINALIZADO`: `Atendida`.

Enquanto o status for `AGENDADO`, `Iniciar agendamento` envia
`PATCH /api/appointments/{id}/status` com `ATENDENDO` e `Cancelar agendamento`
envia o mesmo endpoint com `CANCELADO`. O frontend não faz atualização
otimista: mantém o status confirmado pela API, invalida a lista após sucesso e
exibe o erro de domínio ou de rede no próprio modal.

`FALTA` é uma decisão autoritativa da API. O monitoramento do backend avalia o
horário absoluto do agendamento e, dez minutos após o início, altera para
`FALTA` quando não houve confirmação de `ATENDENDO`; a agenda retorna esse
estado nas consultas subsequentes. Se `ATENDENDO` já foi confirmado antes do
limite, o monitoramento não converte o agendamento.

## Regras do domínio

- Cada agendamento pertence a um paciente, uma unidade e um serviço.
- Profissional é opcional na criação.
- Duração e preço ficam registrados como valores históricos.
- Usuário `BASIC` usa os padrões do serviço; `ADMIN` pode sobrescrevê-los.
- Conflitos de paciente/profissional e capacidade são validados pelo backend e
  apresentados pelo formulário.
- Data e horário são normalizados conforme o fuso IANA da unidade.

### Atendimentos em grupo

Cada registro representa um único paciente. Portanto, para formar uma turma, a
interface envia uma criação independente para cada paciente, inclusive quando o
intervalo já contém outro agendamento. A API é a única autoridade para aceitar
uma vaga, bloquear sobreposição do próprio paciente ou profissional e recusar
capacidade esgotada. Quando aceitos, os registros simultâneos aparecem lado a
lado na grade semanal, com cartão e estado próprios por paciente.

Recorrência, remarcação e os recursos exibidos como `Em breve` fazem parte de
incrementos posteriores e não são alterados por este módulo.
