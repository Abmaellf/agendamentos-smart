# AGENTS.md

## Objetivo

Este repositório usa OpenSpec e CodeGraph para desenvolvimento orientado por especificação (SDD). O agente apoia a implementação, mas a pessoa responsável mantém a decisão sobre escopo, requisitos, dados e ações irreversíveis.

## Fontes de verdade

Para intenção e requisitos, siga esta ordem:

1. instrução explícita atual;
2. change OpenSpec ativa e sua spec;
3. spec base em `openspec/specs/`;
4. documentação atual em `docs/`;
5. código e convenções observadas;
6. inferência, identificada como tal.

Para comportamento realizado, a prioridade é: teste ou comando executado; código/configuração atual; documentação; inferência. Não altere uma spec para justificar código existente nem apresente hipótese como fato.

## Gate obrigatório do OpenSpec

Antes de alterar código, testes, dependências, contratos HTTP, configuração que mude comportamento ou documentação transversal, deve existir em `openspec/changes/<change-id>/`:

1. `proposal.md` com escopo e impacto;
2. delta spec compatível em `specs/<capability>/spec.md`;
3. `tasks.md` com a tarefa que será executada.

Se a change ou a cobertura da spec não existir, pare a implementação e complete o planejamento. Para mudanças puramente internas sem requisito novo, use uma change com `skip_specs: true` em vez de inventar uma capability.

## Ordem mínima de leitura

1. [README.md](./README.md);
2. [guia SDD](./docs/SDD-OpenSpec-CodeGraph.md);
3. a change ativa e a spec base afetada;
4. README do módulo em `src/` e os testes relacionados;
5. somente então o código necessário.

`specs/` contém o histórico do GitHub Spec Kit. Não mova, reescreva nem use esse diretório como segunda fonte de planejamento para mudanças novas.

## Navegação estrutural

Quando `.codegraph/` existir, use CodeGraph antes de busca textual ampla para localizar símbolos, referências, callers, callees e impacto:

```bash
codegraph status
codegraph explore "como a tela de agendamentos chega à API?"
codegraph impact "NomeDoSimbolo"
git diff --name-only | codegraph affected --stdin
```

Use `rg` para documentação, configurações, strings e lacunas de cobertura do grafo. Depois de localizar os símbolos, leia o código-fonte e os testes antes de concluir como algo funciona. O índice é local; nunca versionar `.codegraph/`.

## Segurança e escopo

- Não exponha tokens, cookies, senhas, dados de pacientes ou respostas de perfil.
- Não trate validação do frontend como autorização ou regra definitiva de negócio.
- Não atualize dependências, refatore módulos legados ou altere a API sem escopo explícito na change.
- Peça confirmação antes de ações destrutivas, migrations, dados compartilhados, deploy, commit, push ou expansão material de escopo.
- Preserve alterações de trabalho preexistentes.

## Definition of Done

Antes de encerrar uma change, confirme que os requisitos foram atendidos, tarefas retratam o estado real, a documentação foi atualizada e as verificações relevantes foram executadas ou declaradas bloqueadas. Rode `openspec validate <change-id> --strict`; arquive apenas uma change concluída e validada.
