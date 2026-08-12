# Modal de criação de agendamento

## Objetivo do módulo

Representar um formulário visual para iniciar um novo agendamento.

## Responsabilidades e funcionalidades existentes

`AddSchedulingModal` abre um diálogo com campos de nome, patologia, data e status. Os campos, textos e botão existem, mas não há estado, validação, callback ou chamada HTTP.

## Dependências internas e externas

- internas: primitivas `ui/button`, `ui/dialog`, `ui/input` e `ui/label`;
- externas: React/Radix indiretamente;
- módulo relacionado: `page/Scheduling`.

## Ponto de entrada e fluxo de entrada

Não existe consumidor ativo. Se renderizado, o botão abre e fecha o diálogo; o submit não persiste dados.

## Arquivo crítico

- `index.tsx`: contém apresentação e campos.

## Regras próprias do módulo

- O formulário do MVP deve receber paciente, unidade, serviço, data/hora, duração e profissional opcional; campos de patologia não pertencem ao escopo.
- Serviço fornece duração, preço padrão e capacidade. Usuário básico não pode sobrescrever duração/preço; administrador pode.
- Cada envio cria um agendamento para um único paciente, mesmo quando o horário pertence a uma turma.
- Recorrência deve criar ocorrências independentes vinculadas a uma série; a criação precisa apresentar claramente a regra escolhida.
- A submissão deve bloquear sobreposição de paciente/profissional e capacidade acima do limite do serviço, sem botão para ignorar.
- O novo registro nasce como `AGENDADO`; profissional pode ser atribuído depois, mas será obrigatório antes do início/conclusão.
- O componente deve usar schema tipado, estados de envio/erro/sucesso e função de API, sem acesso direto ao mock.

## Observações técnicas e débitos

- Módulo órfão.
- IDs e nomes de vários campos são repetidos.
- Valores padrão e textos permanecem em inglês ou como placeholders técnicos.
- O contrato de produto está definido em `docs/Requisitos do MVP.md`, mas ainda precisa ser modelado e conectado ao adaptador de mock.
