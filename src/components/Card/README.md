# Cartões da agenda

## Objetivo do módulo

Agrupar componentes que representam uma coluna diária e cada atendimento exibido nela.

## Responsabilidades e funcionalidades existentes

- `CardDay`: recebe dia/data, filtra a coleção local e renderiza atendimentos do dia;
- `CardPatient`: exibe horário, paciente, patologias e status com cores.

## Dependências internas e externas

- internas: `CardDay` depende de `CardPatient` e seus respectivos estilos;
- externas: date-fns e styled-components;
- módulos relacionados: `page/Scheduling`, `WeekDate` e tema legado.

## Pontos de entrada e fluxos de entrada

`Scheduling` cria cinco `CardDay`. Cada cartão diário cria dois agendamentos fixos e entrega os compatíveis por data a `CardPatient`.

## Arquivos críticos

- `CardDay/index.tsx`: contém a fonte de dados atual;
- `CardPatient/styles.ts`: contém o mapa implícito de status para cores.

## Regras próprias do módulo

- Cada cartão representa um agendamento individual de um paciente; participantes da mesma turma permanecem em cartões/registros separados.
- O resumo deve priorizar horário, paciente, serviço, profissional quando atribuído e estado canônico.
- Ações disponíveis dependem do papel e do estado: ambos os perfis podem remarcar e operar estados manuais; somente `ADMIN` pode cancelar; ninguém exclui.
- Remarcação cria um novo registro e mantém o original como `REMARCADO`; cancelamento exige motivo e preserva histórico.
- As cores são apresentação derivada de estados tipados, nunca a própria regra de negócio.

## Observações técnicas e débitos

- Os dados estão embutidos no componente e não representam a API ou `data.json`.
- Tipos e grafia de `Scheduling` não são compartilhados.
- Regras de status estão acopladas à apresentação.
