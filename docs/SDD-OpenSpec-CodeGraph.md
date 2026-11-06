# Desenvolvimento SDD com OpenSpec e CodeGraph

## Finalidade e escopo

Este guia torna o repositório apto ao desenvolvimento orientado por especificação (SDD, *spec-driven development*), aplicando o padrão observado no projeto `censo`: OpenSpec registra intenção e trabalho em curso; CodeGraph reduz o custo de entender relações estruturais; código e testes demonstram o que de fato foi realizado.

Ele foi preparado a partir do checkout atual em **05/11/2026**. A linha de base resultante está em `openspec/specs/`. Ela descreve apenas comportamentos entregues ou observados no frontend; não é confirmação de produção nem substitui validação do backend.

## O que foi preparado

| Item | Estado | Uso |
| --- | --- | --- |
| OpenSpec CLI | instalado globalmente, `1.16.0` | mudanças, specs, validação e arquivamento |
| `openspec/` | versionado neste repositório | `config.yaml`, `specs/`, `changes/` e histórico |
| CodeGraph CLI | instalado globalmente, `1.6.2` | exploração de símbolos, relações e impacto |
| Integração CodeGraph com Codex | configurada globalmente | disponível após reiniciar o agente/IDE |
| `.codegraph/` | índice local inicializado | 84 arquivos, 825 nós e 1.601 relações na criação |
| `AGENTS.md` | versionado | gate SDD, fontes de verdade e regras de operação |
| Linha de base OpenSpec | versionada após arquivamento da change inicial | contrato das capacidades já identificadas |

O arquivo `.codegraph/` guarda banco e metadados locais, portanto está em `.gitignore`; cada checkout cria e mantém o seu próprio índice.

## Instalação em uma máquina nova

O projeto usa Node declarado em `.nvmrc` para a aplicação. Para uma instalação reprodutível das dependências do frontend, prefira `npm ci`. OpenSpec via npm requer Node 22.12 ou superior; se sua máquina usar apenas o Node do projeto e ele for anterior, use o instalador standalone oficial.

```bash
# Dependências da aplicação, na raiz deste repositório
nvm use
npm ci

# OpenSpec: escolha uma das opções oficiais
npm install -g @fission-ai/openspec@latest
# ou, sem depender de Node
curl -fsSL https://openspec.dev/cli/install.sh | sh

# CodeGraph
npm install -g @colbymchenry/codegraph@latest

# Verificação
openspec --version
codegraph --version
```

Configure CodeGraph uma vez por máquina/agente e crie o índice uma vez por checkout:

```bash
codegraph install
codegraph init
codegraph status
```

`codegraph install` configura a integração MCP do agente e pode pedir escolha de ferramenta/localização. Reinicie o agente/IDE depois dele. `codegraph init` é executado na raiz do projeto e cria o índice local. Use `codegraph sync` se uma alteração recente não aparecer no grafo.

Inicialize OpenSpec na raiz. Para Codex, o comando padrão instala skills em `.agents/`; neste checkout essa pasta está montada como somente leitura, por isso a estrutura foi criada com `--tools none` e o protocolo equivalente está em `AGENTS.md`. Em um clone com `.agents/` gravável, execute:

```bash
openspec init --tools codex
```

É seguro executar o comando novamente: ele atualiza os workflows gerados sem apagar specs ou changes.

## Fluxo diário obrigatório

1. Atualize o contexto: leia `README.md`, este guia, a spec base e a change ativa.
2. Verifique o índice: `codegraph status`. Use `codegraph explore` para entender símbolos, fluxo e impacto; use `rg` apenas quando a busca for textual ou documental.
3. Antes de escrever código, crie uma change: `openspec new change <verbo-em-kebab-case>`.
4. Preencha, nessa ordem, `proposal.md`, delta specs, `design.md` quando a decisão técnica for relevante e `tasks.md` com verificações. Use `openspec status --change <id>` para acompanhar os artefatos.
5. Valide e obtenha o alinhamento de escopo necessário. Só então implemente as tarefas. Atualize checkboxes com evidência real.
6. Rode as verificações proporcionais: `npm run lint`, testes afetados, `npm run build` e testes de integração/Postman quando o contrato e o ambiente estiverem disponíveis. Use `git diff --name-only | codegraph affected --stdin` para localizar testes impactados.
7. Valide a change: `openspec validate <id> --strict`. Após tarefas e validações concluídas, execute `openspec archive <id>` para promover seus deltas às specs principais e guardar o histórico.

Exemplo de exploração antes de uma alteração:

```bash
codegraph explore "Como a criação de agendamento chega ao POST e quais testes a cobrem?"
codegraph callers "createAppointment"
codegraph impact "AppointmentsPage"
git diff --name-only | codegraph affected --stdin
```

## Estrutura e fonte canônica

```text
openspec/
├── config.yaml               # contexto e regras SDD do projeto
├── specs/                    # requisitos duráveis e já promovidos
└── changes/
    ├── <change-id>/          # proposal, design, tarefas e deltas em curso
    └── archive/              # changes concluídas, preservadas como histórico
```

- `openspec/specs/` é a referência para requisitos aprovados.
- `openspec/changes/` contém apenas planejamento e execução em curso.
- `openspec/changes/archive/` é imutável para fins práticos: correções e evoluções entram em nova change.
- `specs/` é o histórico existente do GitHub Spec Kit. Ele foi preservado para rastreabilidade da entrega `001-criar-agendamento-manual`, mas não deve competir com OpenSpec em mudanças novas.
- `docs/` descreve contexto, arquitetura e operação; ela não prova sozinha comportamento de runtime.

## Linha de base levantada

| Capability OpenSpec | Evidência principal | Estado da evidência |
| --- | --- | --- |
| `sdd-governance` | `AGENTS.md`, este guia, `openspec/config.yaml` | validada documentalmente |
| `application-shell-baseline` | `src/App.tsx`, `src/Router.tsx`, layouts | inspeção estática; sem teste de rota dedicado |
| `access-session-baseline` | redirecionamento inicial, login, sessão da agenda | inspeção estática; sem teste dedicado de login |
| `weekly-appointments` | feature, schemas e testes Vitest/MSW | entrega parcial com testes divergentes, ver lacunas |
| `legacy-patient-management` | página, contexto e dois diálogos de paciente | inspeção estática; sem testes dedicados |

### Lacunas conhecidas na linha de base

- `npm run build` falha com três erros TypeScript no calendário legado porque os fixtures não atendem mais ao contrato `Appointment` atual.
- O teste direcionado do calendário legado falha em 10 de 11 casos: `CardPatient` espera `appointment.patient.name`, ausente nos fixtures antigos.
- Os handlers MSW do teste ainda atendem `/api/appointment`, enquanto a feature atual chama `/api/appointments`. O teste direcionado de integração da agenda falha em 11 de 14 casos por requests não interceptadas.
- A página de pacientes mantém duas implementações de criação, com endpoints e estados distintos; o filtro apenas recarrega a lista, e as ações de editar/desativar não têm implementação.
- Login e página inicial têm comportamento entregue, mas rotas internas não possuem guarda central. Cadastro de usuário, profissional e configurações ainda não são fluxos funcionais completos.

Essas lacunas não foram transformadas em requisitos aprovados. Crie changes próprias para corrigi-las, começando por uma proposta que escolha o contrato esperado.

### Verificações executadas na adoção

| Comando | Resultado |
| --- | --- |
| `npm run lint` | aprovado |
| `npm run build` | falhou pelas três incompatibilidades TypeScript do calendário legado |
| `npm run test -- src/components/__tests__/legacy-calendar-components.test.tsx --reporter=dot --silent` | 10 falhas, 1 sucesso |
| `npm run test -- src/features/appointments/__tests__/appointments-page.integration.test.tsx --reporter=dot --silent` | 11 falhas, 3 sucessos |
| `openspec validate --all --strict` | aprovado: 5 specs |
| `codegraph status` | aprovado: índice em WAL, 86 arquivos, 825 nós e 1.601 relações |

## Comandos de referência

```bash
# Visão geral
openspec list --specs
openspec list
openspec view

# Planejar e validar uma change
openspec new change corrigir-contrato-msw-agenda
openspec status --change corrigir-contrato-msw-agenda
openspec validate corrigir-contrato-msw-agenda --strict

# Promover a change concluída
openspec archive corrigir-contrato-msw-agenda

# Índice estrutural
codegraph status
codegraph sync
codegraph explore "como funciona o login?"
```

Referências oficiais: [OpenSpec](https://openspec.dev/docs/setup) e [CodeGraph](https://colbymchenry.github.io/codegraph/getting-started/installation/).
