# Página de agendamentos

## Objetivo do módulo

Apresentar uma grade semanal de segunda a sexta e permitir escolher a semana por uma data de referência.

## Responsabilidades e funcionalidades existentes

- inicia na data atual;
- abre calendário em popover;
- calcula cinco dias úteis com date-fns;
- renderiza cabeçalho semanal e cartões por dia;
- alterna composição desktop/móvel por estilos responsivos.

## Dependências internas e externas

- internas: `components/ui`, `Card/CardDay`, `WeekDate` e `styles.ts`;
- externas: React, date-fns, react-day-picker por meio de `Calendar`, styled-components e Helmet;
- módulos relacionados: `SchedulingContext` e `data.json`, embora nenhum forneça agendamentos à página.

## Ponto de entrada e fluxo de entrada

Rota `/agendamento` → seleção de data → cálculo do início da semana → cinco `CardDay` → cartões de paciente com dados fixos.

## Arquivos críticos

- `index.tsx`: estado de data, calendário e composição;
- `styles.ts`: layout desktop/móvel;
- `components/Card/CardDay/index.tsx`: fonte atual dos dados exibidos.

## Regras próprias do módulo

### Contrato do agendamento

- Cada agendamento pertence a um paciente, uma unidade e um serviço, com data/hora, duração, preço histórico e profissional opcional na criação.
- Profissional é obrigatório antes de `EM_ATENDIMENTO` ou `CONCLUIDO`.
- Em turmas, cada paciente possui um agendamento separado no mesmo serviço/horário; o total respeita a capacidade do serviço, de 1 a 10.
- Sobreposição do mesmo paciente ou profissional e capacidade excedida são sempre bloqueadas, inclusive para administrador.

### Operações e estados do primeiro MVP

- Estados: `AGENDADO`, `CONFIRMADO`, `EM_ATENDIMENTO`, `CONCLUIDO`, `CANCELADO`, `FALTA` e `REMARCADO`.
- Confirmação, início, conclusão e falta são manuais na primeira entrega e podem ser operados por administrador ou usuário básico.
- Usuário básico e administrador podem remarcar; a ocorrência original fica `REMARCADO` e o novo registro aponta para ela.
- Somente administrador cancela, sempre com motivo. Em recorrência, o cancelamento pode abranger a ocorrência selecionada e as próximas.
- Nenhum perfil exclui agendamentos.

### Recorrência e etapas futuras

- Recorrência cria ocorrências independentes ligadas a uma série; uma remarcação altera somente o dia selecionado.
- Confirmação automática quatro horas antes, falta automática ao final da duração sem início e conclusão automática do atendimento iniciado pertencem à segunda etapa.
- A agenda deve ser consultada pelo `tenantId`, `unitId` e intervalo visível por uma função de API tipada.

## Observações técnicas e débitos

- A agenda não chama API nem lê `data.json`.
- A regra de cinco dias é duplicada entre a página e `SchedulingContext`/`WeekDate`.
- O CSS de `react-datepicker` é carregado, mas o componente usado é baseado em `react-day-picker`.
- No fluxo móvel, o elemento externo do `map` não possui `key`.
- Seleção indefinida lança erro em vez de simplesmente ignorar/validar a ação.
- `AddSchedulingModal` existe, mas não é renderizado.
