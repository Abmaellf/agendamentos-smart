# Design

## Context

O repositório é uma SPA React/Vite com uma feature moderna de agendamentos e módulos legados de autenticação e pacientes. O histórico `specs/001-criar-agendamento-manual` usa GitHub Spec Kit; OpenSpec foi inicializado sem skills locais porque `.agents/` está em modo somente leitura. CodeGraph foi configurado globalmente para Codex e indexado localmente.

## Goals / Non-Goals

**Goals:**

- Criar uma única trilha para mudanças futuras: OpenSpec antes de editar comportamento, CodeGraph antes de explorar relações estruturais.
- Promover specs de linha de base que descrevam apenas o que o checkout evidencia.
- Preservar a documentação e o histórico existentes, expondo lacunas sem alterá-las.

**Non-Goals:**

- Corrigir rotas, handlers MSW, tipos legados, autenticação, pacientes ou qualquer outro comportamento de runtime.
- Migrar ou remover o diretório `specs/` existente.
- Declarar backend, produção ou contratos externos validados.

## Decisions

### OpenSpec é a fonte para mudanças novas

`openspec/specs/` conterá requisitos duráveis, `changes/` conterá deltas em execução e `archive/` manterá o histórico. A escolha evita duplicar planejamento em documentos soltos. O diretório Spec Kit continua somente como histórico porque removê-lo ou reescrevê-lo perderia rastreabilidade.

### Specs de baseline preservam lacunas

As capabilities são agrupadas por comportamento de produto e não por pastas técnicas. Onde a evidência é parcial, a documentação registra o limite em vez de criar um requisito silencioso ou transformar uma falha conhecida em contrato.

### CodeGraph é local e não versionado

O banco em `.codegraph/` é específico do checkout. Ele deve ser recriado com `codegraph init`, mantido com `sync` e ignorado pelo Git. A configuração do agente é global por limitação de permissão da pasta `.codex` local.

### AGENTS.md aplica o gate operacional

Como as skills geradas pelo OpenSpec não podem ser escritas em `.agents/` neste checkout, `AGENTS.md` fornece o protocolo versionado, e `openspec init --tools codex` fica indicado para clones onde essa pasta puder ser gravada.

## Risks / Trade-offs

- [Baseline pode envelhecer] → toda mudança futura atualiza a spec correspondente ao arquivar a change.
- [Índice CodeGraph desatualizado] → verificar `codegraph status` e usar `codegraph sync` antes de concluir uma análise.
- [Duas ferramentas de spec confundirem o fluxo] → OpenSpec é canônico; `specs/` é explicitamente histórico.
- [Falhas existentes serem ocultadas] → documentar o resultado real de build/testes e abrir changes específicas para correções.
