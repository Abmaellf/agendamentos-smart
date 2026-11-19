# Design

## Context

Consulte `proposal.md` para a motivação e `specs/weekly-appointments/spec.md` para o contrato observável. O diálogo atual mantém um `AppointmentFormState` controlado, carrega os três catálogos obrigatórios ao abrir, busca profissionais por `serviceId` e usa `FormField` para gerar o `id`, associar o label e conectar erros via `aria-describedby`.

O repositório já possui primitives de `Input`, `Popover` e ícones, mas não possui um combobox de catálogo compartilhado. O novo controle precisa caber no modal de duas colunas, preservar a aparência dos campos atuais e não introduzir dependência ou contrato HTTP novo.

## Goals / Non-Goals

**Goals:**

- Oferecer um controle único e reutilizável para os quatro catálogos do diálogo.
- Manter o formulário como fonte do identificador selecionado e preservar callbacks específicos, especialmente a atualização de duração/preço ao trocar serviço.
- Separar o estado transitório da busca do valor confirmado, permitindo cancelar a busca sem apagar a seleção.
- Garantir foco, teclado, nome acessível, erro e estado expandido compatíveis com o `FormField`.
- Filtrar em memória com uma normalização determinística de caixa e acentuação, sem requests por tecla.

**Non-Goals:**

- Criar busca no backend, paginação ou debounce para endpoints.
- Alterar os tipos de opção, os identificadores enviados ou a regra de profissionais por serviço.
- Transformar o `DropdownMenu` existente em combobox; menu e seleção pesquisável têm semânticas diferentes.
- Alterar o comportamento dos campos de data, horário, duração e preço.

## Decisions

### Controle genérico controlado para catálogos

Criar um controle apresentacional de seleção pesquisável com opções `{ id, label }`, `value`, `onValueChange`, `placeholder`, `disabled`, estado de carregamento e texto para vazio. O controle manterá internamente somente `open`, texto digitado e índice/opção ativa; o valor selecionado continuará vindo do diálogo.

Alternativa considerada: manter quatro implementações independentes no diálogo. Foi rejeitada porque repetiria a lógica de foco, filtro e acessibilidade e aumentaria o risco de divergências entre paciente, unidade, serviço e profissional.

### Combobox com popover e listbox

O campo visível funcionará como combobox; ao abrir, o popover exibirá uma linha de busca com ícone de lupa e a lista filtrada. A lista usará semântica de opções selecionáveis, com uma mensagem distinta quando não houver correspondência. A largura do popover acompanhará o campo e seu conteúdo terá rolagem controlada para catálogos longos.

Alternativa considerada: usar `DropdownMenu` com um input dentro. Foi rejeitada porque `DropdownMenu` representa ações/menu e não fornece o contrato de combobox, seleção e busca exigido pelo campo.

### Filtragem local normalizada

Derivar a lista filtrada a partir do catálogo já carregado, aplicando `trim`, conversão para minúsculas e remoção de diacríticos tanto no texto digitado quanto no nome da opção. A filtragem será recalculada somente quando o texto ou catálogo mudar; nenhuma alteração de tecla chamará API.

Alternativa considerada: busca exata ou filtragem somente no início do nome. Foi rejeitada porque nomes de pacientes e profissionais podem ser longos e a localização por qualquer trecho é mais eficiente para o uso do modal.

### Integração explícita com `FormField`

O controle externo receberá e repassará `id` e `aria-describedby` no elemento combobox que representa o valor selecionado. O `FormField` continuará sendo responsável por gerar o id, renderizar o label e publicar o erro. O input de busca terá um nome acessível próprio e ficará dentro do popover, sem substituir o nome do campo principal. Ao receber erro de validação, o foco será direcionado ao combobox; ao fechar sem escolha, o valor anterior será restaurado.

### Adaptador no diálogo

O diálogo mapeará cada catálogo para `{ id, label }` e manterá a lógica existente nos callbacks. Paciente, unidade e serviço usarão placeholder “Selecione”; profissional incluirá a opção vazia “Sem profissional”. Ao trocar serviço, o diálogo limpará o profissional, consultará o novo catálogo e preservará as regras atuais de duração/preço e de papel do usuário.

## Risks / Trade-offs

- [Catálogos muito grandes podem gerar muitas opções no DOM] → limitar a altura da lista, usar rolagem e manter a filtragem local; virtualização fica fora do escopo até haver evidência de necessidade.
- [Semântica ARIA incorreta pode prejudicar leitores de tela] → testar nome, `aria-expanded`, `aria-controls`, `aria-activedescendant`/opção ativa, `aria-describedby`, foco e teclado no diálogo.
- [A seleção de serviço pode deixar estado derivado obsoleto] → reutilizar o callback atual de troca de serviço e cobrir a limpeza do profissional e o preenchimento de duração/preço.
- [A troca do select nativo pode alterar testes e expectativas de valor] → manter o valor controlado como identificador, preservar o nome acessível e adaptar os testes para interagir com o combobox e confirmar o payload.
- [Busca digitada pode parecer uma alteração confirmada] → separar texto de busca de `value`, fechar e limpar a busca após seleção e restaurar o valor anterior em Escape/clique externo.

## Migration Plan

1. Criar o controle apresentacional e seus testes isolados de filtro, estados, seleção e teclado.
2. Substituir somente os quatro selects do diálogo, mantendo o estado, schemas, queries e callbacks existentes.
3. Ajustar os testes do diálogo para cobrir busca por trecho, acentuação, vazio, seleção, profissional dependente e associação com `FormField`.
4. Atualizar os READMEs de `appointments` e `components/ui` ou `components` conforme a localização final do controle.
5. Executar testes direcionados, lint, build e validação estrita da change; se a migração for revertida, remover apenas o controle e os testes novos, sem alterar API ou dados.

## Open Questions

Não há questões abertas que alterem o contrato ou a abordagem. O limite de virtualização e filtros por atributos adicionais podem ser avaliados em change própria caso o volume real dos catálogos justifique.
