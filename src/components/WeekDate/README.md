# Cabeçalho de dias da semana

## Objetivo do módulo

Exibir os rótulos formatados dos cinco dias úteis da semana selecionada.

## Responsabilidades e funcionalidades existentes

Calcula e apresenta os rótulos dos cinco dias úteis a partir da data recebida.

## Dependências internas e externas

- internas: tokens Tailwind definidos em `globals.css`;
- externas: date-fns e locale `pt-BR`;
- módulo relacionado: `features/appointments`.

## Ponto de entrada e fluxo de entrada

O componente recebe `date`, calcula cinco dias úteis localmente e renderiza os
rótulos. A página atual de agendamentos não o utiliza.

## Arquivos críticos

- `index.tsx`: cálculo dos dias e apresentação com Tailwind.

## Regras próprias do módulo

- Rótulos devem derivar de uma única função de calendário, em `pt-BR` e com fuso consistente com os agendamentos.
- A visualização atual de segunda a sexta é uma escolha de interface, não uma regra confirmada que proíba agendamentos em outros dias.
- Dias disponíveis do profissional são informativos/restritivos por dia da semana; o MVP não possui faixas de jornada ou intervalos intradiários.
- Mudar a semana deve alterar a chave da consulta da agenda da unidade ativa, sem duplicar estado derivável em componentes.

## Observações técnicas e débitos

- O componente usa Tailwind, mas continua sem consumidor ativo.
- A página também calcula os mesmos dias, duplicando regra de calendário.
