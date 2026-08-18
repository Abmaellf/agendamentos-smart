# Cartão de atendimento/paciente

## Objetivo do módulo

Apresentar os dados resumidos de um atendimento dentro de um dia da agenda.

## Responsabilidades e funcionalidades existentes

Exibe horário, nome, lista de patologias e status. O estilo escolhe fundo, borda e texto a partir do status.

## Dependências internas e externas

- internas: `ui/Card`, `ui/Separator` e utilitário `cn`;
- externa: Tailwind;
- módulo relacionado: `CardDay`.

## Ponto de entrada e fluxo de entrada

`CardDay` entrega um objeto `appointment` e o indicador `isToDay`; não há acesso direto a contexto ou API.

## Arquivos críticos

- `index.tsx`: contrato local, marcação e regras visuais para `Agendado`, `Concluido`, `Cancelado`, `Falta`, `Em atendimento` e `Reagendado`.

## Regras próprias do módulo

- O contrato visual deve usar os estados canônicos `AGENDADO`, `CONFIRMADO`, `EM_ATENDIMENTO`, `CONCLUIDO`, `CANCELADO`, `FALTA` e `REMARCADO`.
- O cartão deve exibir serviço/especialidade do atendimento, não patologia ou conteúdo clínico fora do MVP.
- Profissional ausente deve aparecer como “a definir”; iniciar ou concluir fica indisponível até sua atribuição.
- Usuário básico pode confirmar, iniciar, concluir e remarcar, mas não cancelar; somente administrador vê/executa cancelamento com motivo.
- Não deve existir ação de exclusão. Estado deve ser comunicado por rótulo além da cor.

## Observações técnicas e débitos

- Status são strings livres e possuem diferenças de acentuação/capitalização.
- O status `Ativo` usado pelos dados fixos cai no estilo padrão branco.
- Cores de negócio devem ser mapeadas por um tipo canônico.
- O componente foi migrado para Tailwind/shadcn, mas continua sem consumidor ativo.
