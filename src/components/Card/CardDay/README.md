# Cartão de dia

## Objetivo do módulo

Renderizar os agendamentos que pertencem a uma data da grade semanal.

## Responsabilidades e funcionalidades existentes

Recebe `date`, `isToday` e `dayWeek`, monta dois objetos de agendamento em memória, formata suas datas e renderiza `CardPatient` quando a data coincide.

## Dependências internas e externas

- interna: `../CardPatient` e `styles.ts`;
- externas: date-fns e locale `pt-BR`;
- módulo relacionado: `page/Scheduling`.

## Ponto de entrada e fluxo de entrada

`Scheduling` → `CardDay` → filtro por `dd/MM/yyyy` → `CardPatient`.

## Arquivos críticos

- `index.tsx`: fonte e filtro dos dados;
- `styles.ts`: borda/fundo conforme dia atual.

## Regras próprias do módulo

- O componente deve receber agendamentos do escopo `tenantId`/`unitId` e da data consultada, sem criar fixtures durante a renderização.
- A data deve ser comparada por valor temporal normalizado e fuso explícito, não por texto formatado.
- Cada agendamento do dia permanece individual; igualdade de serviço/horário pode ser apresentada como turma, mas não deve fundir pacientes em um registro.
- Ocupação de turma deve mostrar quantidade atual e capacidade do serviço quando relevante.
- A coluna não decide conflito, transição, recorrência ou permissão; apenas apresenta dados e encaminha ações tipadas.

## Observações técnicas e débitos

- Dados de pacientes e atendimentos são fixos.
- `dayWeek` é recebido, mas não usado dentro do componente.
- O contexto de agendamentos aparece apenas comentado.
- A integração futura deve fornecer IDs e datas estáveis, sem criar `new Date` durante renderização.
