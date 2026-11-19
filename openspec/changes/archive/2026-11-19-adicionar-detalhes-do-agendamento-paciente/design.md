# Design

## Context

Consulte `proposal.md` e o delta de `weekly-appointments` para a motivação e o contrato observável. Hoje `AppointmentsPage` consulta a coleção semanal e renderiza cada agendamento como um `article` sem ação de seleção. O tipo de domínio deverá reconhecer `AGENDADO`, `ATENDENDO`, `CANCELADO`, `FALTA` e `FINALIZADO`; a API irmã expõe a mutação de status nesta etapa.

## Goals / Non-Goals

**Goals:**

- Abrir um único agendamento selecionado em um diálogo acessível e visualmente alinhado à referência.
- Reutilizar os dados do `Appointment` retornado pela agenda, mantendo campos ausentes identificáveis como indisponíveis.
- Encapsular as regras de habilitação das ações e mapear rótulos da interface para os estados canônicos existentes.
- Persistir transições confirmadas e sincronizar o cartão, o modal e a consulta semanal.
- Manter a regra de falta compatível com recarregamento e com uma fonte de verdade no backend.

**Non-Goals:**

- Criar uma segunda entidade de detalhe, uma rota própria ou uma cópia editável do agendamento.
- Simular persistência com estado local, `localStorage` ou timer que sobreviva somente enquanto o modal estiver aberto.
- Implementar conclusão, edição, remarcação, dados do cadastro do paciente ou observações.

## Decisions

### 1. Seleção local e diálogo específico da feature

Adicionar um componente de detalhe dentro de `features/appointments/components` e manter no `AppointmentsPage` apenas o agendamento selecionado e o estado de abertura. O cartão continuará pertencendo à grade, mas passará a expor uma ação de seleção com nome acessível, preservando os `data-testid` e os metadados de layout já usados pelos testes.

Alternativa rejeitada: navegar para uma rota `/appointments/:id`. A referência apresenta um modal sobre a agenda, e uma rota nova aumentaria o escopo de navegação e exigiria carregamento individual que não existe hoje.

### 2. Mapear a interface para os estados canônicos

`AGENDADO` será exibido como `Aguardando atendimento`; `ATENDENDO` como `Atendimento iniciado`; `CANCELADO` como `Cancelado`; `FALTA` como `Falta`; e `FINALIZADO` como `Atendida` somente para leitura. A ação `Iniciar agendamento` envia `ATENDENDO` e não terá reversão pelo modal. O botão de cancelar será derivado exclusivamente de `status === 'AGENDADO'`.

Alternativa rejeitada: criar `AGUARDANDO_ATENDIMENTO` e `ATENDIMENTO_INICIADO` como novos valores persistidos. Isso duplicaria o contrato atual e criaria divergência entre a agenda e a API.

### 3. Mutação explícita e sem atualização otimista

O adaptador de appointments deverá encapsular uma mutação `PATCH /api/appointments/{id}/status` com `{ status }` e resposta `Appointment` atualizado, sujeito à confirmação do contrato da API irmã. A interface mostrará carregamento durante a solicitação, aplicará a resposta somente após sucesso, fechará ou manterá o diálogo conforme o resultado definido pelo componente e invalidará a lista semanal.

Alternativa rejeitada: alterar imediatamente a cor do cartão e desfazer em caso de erro. A API é a autoridade sobre autorização, transição e integridade; uma atualização otimista poderia exibir um estado que nunca foi persistido.

### 4. Falta autoritativa e atualização de fronteira temporal

A API deverá persistir ou derivar `FALTA` e retorná-lo na leitura da agenda quando `startsAt + 10 minutos` for atingido sem `ATENDENDO`. O frontend poderá refazer a consulta ao abrir o detalhe, ao retornar foco para a agenda ou em uma atualização controlada, mas não decidirá a falta apenas com um relógio local. O resultado recebido será tratado como estado do agendamento e bloqueará início/cancelamento.

Alternativa rejeitada: um `setTimeout` no modal que dispara a falta somente para a sessão atual. Essa abordagem falha ao fechar/reabrir a tela, não é confiável em abas suspensas e não persiste o status.

### 5. Campos fora do contrato como estados de produto

As áreas de telefone, e-mail, nascimento, sala, observações, cadastro completo, edição e conclusão serão renderizadas como controles ou blocos desabilitados com `Em breve`. Nenhum valor será inferido do nome do paciente, do serviço ou do agendamento.

Alternativa rejeitada: ocultar todos esses elementos. A referência visual e o pedido exigem que o que está fora de escopo fique reconhecível, mas indisponível.

## Risks / Trade-offs

- [Contrato de status ausente na API] → alinhar a rota, o payload, os estados aceitos e os erros antes da implementação; manter MSW/testes do frontend compatíveis com esse contrato e não entregar uma transição apenas local.
- [Divergência de nomes de estado entre frontend e backend] → manter o mapeamento em um único adaptador/modelo e cobrir `AGENDADO`, `ATENDENDO`, `CANCELADO` e `FALTA` em testes de integração.
- [Relógio, fuso ou atraso de consulta] → comparar o limite usando o instante e `timeZone` do agendamento quando necessário, mas confiar no estado autoritativo retornado pela API; registrar o caso de resposta atrasada como erro/estado de recarregamento.
- [Cartões compactos e acessibilidade] → usar uma ação de seleção acessível no cartão e preservar nome completo, serviço, horário e status em rótulos acessíveis mesmo quando o texto visual for truncado.

## Migration Plan

1. Alinhar e documentar na API irmã o contrato de transição e a regra autoritativa de `FALTA`.
2. Implementar o adaptador de status e os handlers/fixtures de teste no frontend.
3. Adicionar o diálogo e conectar a seleção dos cartões, mantendo os modos Semana/Dia/Lista existentes.
4. Executar testes direcionados, lint e build; validar a change com `openspec validate adicionar-detalhes-do-agendamento-paciente --strict`.
5. Em caso de rollback, remover a ação de seleção e a mutação de status do frontend sem alterar o contrato de criação nem excluir appointments.
